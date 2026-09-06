import bcrypt from "bcryptjs";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import crypto from "crypto";
import path from "path";
import ejs from "ejs";
import { prisma } from "../../lib/prisma";
import { transporter } from "../../lib/nodemailer";
import { jwtUtils } from "../../utils/jwt";
import type {
  IGoogleLogin,
  ILoginUserPayload,
  IRegisterUserPayload,
  IRequestUser,
  IForgotPasswordPayload,
  IVerifyEmailPayload,
  IResetPasswordPayload,
  IUpdateProfilePayload,
  IUserQueryFilters,
  IUpdateUserStatusParams,
} from "./auth.interface";
import { redisClient } from "../../lib/redis";
import { TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import { paginationHelper } from "../../utils/paginationHelper";
import { Prisma } from "../../../generated/prisma/browser";

const registerUser = async (payload: IRegisterUserPayload) => {
  const { name, role, password } = payload;

  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new Error("User with this email already exists");
  }
  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    throw new Error(
      "Registration for ADMIN or SUPER_ADMIN roles is strictly prohibited from public endpoints!",
    );
  }

  const hashedPassword = password ? await bcrypt.hash(password, 8) : null;

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        status: UserStatus.ACTIVE,
      },
    });

    let profileData = null;

    switch (role) {
      case Role.CUSTOMER:
        profileData = await tx.customer.create({
          data: {
            userId: user.id,
            accountNumber: `ACC-${Date.now().toString().slice(-6)}`,
            meterNumber: `MTR-${Date.now().toString().slice(-6)}`,
            balance: 0.0,
            areaId: null,
            billingAddress: null,
          },
        });
        break;

      case Role.TECHNICIAN:
        profileData = await tx.technician.create({
          data: {
            userId: user.id,
            status: "AVAILABLE",
            zoneId: null,
            specialization: null,
          },
        });
        break;

      case Role.ZONE_MANAGER:
        profileData = await tx.zoneManager.create({
          data: {
            userId: user.id,
            zoneId: null,
            officeRoomNo: null,
          },
        });
        break;

      case Role.POWER_OPERATOR:
        profileData = await tx.powerOperator.create({
          data: {
            userId: user.id,
            substationId: null,
            shift: null,
          },
        });
        break;

      default:
        throw new Error("Invalid or unauthorized User Role provided");
    }

    return {
      user,
      profile: profileData,
    };
  });

  const { password: _, ...userResponse } = createdUser.user;

  const jwtPayload = {
    userId: userResponse.id,
    name: userResponse.name,
    email: userResponse.email,
    role: userResponse.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user: userResponse,
    profile: createdUser.profile,
    accessToken,
    refreshToken,
  };
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const otp = payload.otp;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist?.status === "BLOCKED") {
    throw new Error("User is Blocked");
  }

  if (isUserExist?.emailVerified) {
    throw new Error("Email Already Verified");
  }

  if (isUserExist?.isDeleted || isUserExist?.status === "DELETED") {
    throw new Error("User is Deleted");
  }

  const otpKey = `user-registration-otp:${email}`;
  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new Error("Invalid or Expired OTP");
  }

  if (redisOtp !== otp) {
    throw new Error("OTP Does Not Match");
  }

  await redisClient.del(otpKey);

  const userRegistrationKey = `user-registration-data:${email}`;
  const redisUserData = await redisClient.get(userRegistrationKey);

  if (!redisUserData) {
    throw new Error("Registration data not found or expired");
  }

  const userPayload: IRegisterUserPayload = JSON.parse(redisUserData);

  const createdResult = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: userPayload.name,
        email: userPayload.email,
        password: userPayload.password,
        role: userPayload.role,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    let profileData = null;

    switch (userPayload.role) {
      case Role.CUSTOMER:
        profileData = await tx.customer.create({
          data: {
            userId: user.id,
            accountNumber: `ACC-${Date.now().toString().slice(-6)}`,
            meterNumber: `MTR-${Date.now().toString().slice(-6)}`,
          },
        });
        break;

      case Role.TECHNICIAN:
        profileData = await tx.technician.create({
          data: {
            userId: user.id,
            status: "AVAILABLE",
          },
        });
        break;

      case Role.ZONE_MANAGER:
        profileData = await tx.zoneManager.create({
          data: { userId: user.id },
        });
        break;

      case Role.POWER_OPERATOR:
        profileData = await tx.powerOperator.create({
          data: {
            userId: user.id,
            employeeId: `EMP-${Date.now().toString().slice(-4)}`,
          },
        });
        break;

      default:
        break;
    }

    return { user, profile: profileData };
  });

  await redisClient.del(userRegistrationKey);

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/welcome-email.ejs",
  );

  let html = "";
  try {
    const templateData = { name: createdResult.user.name };
    html = await ejs.renderFile(templatePath, templateData);
  } catch (ejsError) {
    console.log("EJS Render Warning (Proceeding with backup text):", ejsError);
    html = `<h1>Welcome ${createdResult.user.name} to PowerGrid Management System!</h1>`;
  }

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Welcome To Smart Load Shedding & Power Outage Management System",
    html,
  });

  const jwtPayload = {
    userId: createdResult.user.id,
    name: createdResult.user.name,
    email: createdResult.user.email,
    role: createdResult.user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  const { password: _, ...cleanUser } = createdResult.user;

  return {
    user: cleanUser,
    profile: createdResult.profile,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error("User is blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error("User is deleted");
  }

  if (user.password === null && user.googleId !== null) {
    throw new Error("Already Has an Account, Please Login With Google Account");
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid credentials");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExists) {
    throw new Error("User not found");
  }

  let profileData = null;

  switch (isUserExists.role) {
    case Role.CUSTOMER:
      profileData = await prisma.customer.findUnique({
        where: { userId: isUserExists.id },
        include: { area: true },
      });
      break;

    case Role.TECHNICIAN:
      profileData = await prisma.technician.findUnique({
        where: { userId: isUserExists.id },
        include: { zone: true },
      });
      break;

    case Role.ZONE_MANAGER:
      profileData = await prisma.zoneManager.findUnique({
        where: { userId: isUserExists.id },
        include: { zone: true },
      });
      break;

    case Role.POWER_OPERATOR:
      profileData = await prisma.powerOperator.findUnique({
        where: { userId: isUserExists.id },
        include: { substation: true },
      });
      break;

    case Role.ADMIN:
    case Role.SUPER_ADMIN:
      break;

    default:
      break;
  }

  return {
    ...isUserExists,
    profile: profileData,
  };
};

const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new Error(
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new Error("User is inactive or not found");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const googleLogin = async (payload: IGoogleLogin) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("Google Id Token Verification Failed", error);
    throw new Error("Invalid or Expired Google Id Token");
  }

  if (!googleIdTokenPayload) {
    throw new Error("Invalid or Expired Google Id Token");
  }

  if (!googleIdTokenPayload.name) {
    throw new Error("Google Email Name Not Found");
  }

  if (!googleIdTokenPayload.email) {
    throw new Error("Google Email Not Found");
  }

  const targetEmail = googleIdTokenPayload.email.trim().toLowerCase();

  const ifUserExistWithGoogleAuth = await prisma.user.findUnique({
    where: {
      email: targetEmail,
      role: Role.CUSTOMER,
      googleId: googleIdTokenPayload.sub,
    },
  });

  let user = ifUserExistWithGoogleAuth;

  if (!ifUserExistWithGoogleAuth) {
    const ifUserExistWithCredentials = await prisma.user.findUnique({
      where: {
        email: targetEmail,
        role: Role.CUSTOMER,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });

    if (ifUserExistWithCredentials) {
      if (!ifUserExistWithCredentials.emailVerified) {
        throw new Error("Email is Not Verified");
      }

      if (ifUserExistWithCredentials.status === "BLOCKED") {
        throw new Error("User is Blocked");
      }

      if (
        ifUserExistWithCredentials.isDeleted ||
        ifUserExistWithCredentials.status === UserStatus.DELETED
      ) {
        throw new Error("User is Deleted");
      }

      user = await prisma.user.update({
        where: {
          id: ifUserExistWithCredentials.id,
        },
        data: {
          googleId: googleIdTokenPayload.sub,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email: targetEmail,
          role: Role.CUSTOMER,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
          customer: {
            create: {
              accountNumber: `ACC-${Date.now().toString().slice(-6)}`,
              meterNumber: `MTR-${Date.now().toString().slice(-6)}`,
            },
          },
        },
      });
    }
  }

  if (!user) {
    throw new Error("User Not Found");
  }

  if (user.status === "BLOCKED") {
    throw new Error("User is Blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error("User is Deleted");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { email } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new Error("User Does Not Exist!");
  }

  if (isUserExist.status === "BLOCKED") {
    throw new Error("User is Blocked");
  }

  if (!isUserExist.emailVerified) {
    throw new Error("User Not Verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === "DELETED") {
    throw new Error("User is Deleted");
  }

  if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
    throw new Error("User Has Account With Google");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const key = `forgor-password-otp:${isUserExist.email}`;

  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const tempatePath = path.join(
    process.cwd(),
    "src/app/templates/forgot-password.ejs",
  );

  const templateData = {
    name: isUserExist.name,
    otp,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(tempatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "Forgot Password",
    html,
  });
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExist) {
    throw new Error("User Does Not Exist!");
  }

  if (isUserExist.status === "BLOCKED") {
    throw new Error("User is Blocked");
  }

  if (!isUserExist.emailVerified) {
    throw new Error("User Not Verified");
  }

  if (isUserExist.isDeleted || isUserExist.status === "DELETED") {
    throw new Error("User is Deleted");
  }

  if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
    throw new Error("User Has Account With Google");
  }

  const key = `forgor-password-otp:${isUserExist.email}`;

  const redisOtp = await redisClient.get(key);

  if (!redisOtp) {
    throw new Error("Invalid OTP");
  }

  if (redisOtp !== otp) {
    throw new Error("OTP Does Not Match");
  }

  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: {
      email: isUserExist.email,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  await redisClient.del([key]);

  const tempatePath = path.join(
    process.cwd(),
    "src/app/templates/reset-password-success.ejs",
  );

  const templateData = {
    name: isUserExist.name,
  };

  const html = await ejs.renderFile(tempatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "Password Changed",
    html,
  });
};

const updateProfileInDB = async (
  userId: string,
  role: Role,
  payload: IUpdateProfilePayload,
) => {
  const {
    name,
    phone,
    gender,
    address,
    profileImage,
    areaId,
    meterNumber,
    officeRoomNo,
    zoneId,
    specialization,
  } = payload;

  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        phone: phone !== undefined ? phone : undefined,
        gender: gender !== undefined ? gender : undefined,
        address: address !== undefined ? address : undefined,
        profileImage: profileImage !== undefined ? profileImage : undefined,
      },
      omit: { password: true },
    });

    let updatedProfile = null;

    switch (role) {
      case Role.CUSTOMER:
        updatedProfile = await tx.customer.update({
          where: { userId: userId },
          data: {
            areaId:
              areaId !== undefined ? (areaId as string | null) : undefined,
            meterNumber: meterNumber ? (meterNumber as string) : undefined,
          },
          include: { area: true },
        });
        break;

      case Role.TECHNICIAN:
        updatedProfile = await tx.technician.update({
          where: { userId: userId },
          data: {
            zoneId:
              zoneId !== undefined ? (zoneId as string | null) : undefined,
            specialization:
              specialization !== undefined
                ? (specialization as string | null)
                : undefined,
          },
          include: { zone: true },
        });
        break;

      case Role.ZONE_MANAGER:
        updatedProfile = await tx.zoneManager.update({
          where: { userId: userId },
          data: {
            zoneId:
              zoneId !== undefined ? (zoneId as string | null) : undefined,
            officeRoomNo:
              officeRoomNo !== undefined
                ? (officeRoomNo as string | null)
                : undefined,
          },
          include: { zone: true },
        });
        break;

      default:
        break;
    }

    return {
      user: updatedUser,
      profile: updatedProfile,
    };
  });
};

const getAllUsersFromDB = async (filters: IUserQueryFilters, options: any) => {
  const {
    searchTerm,
    role,
    areaId,
    feederId,
    substationId,
    zoneId,
    powerAuthorityId,
  } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (role) {
    andConditions.push({ role });
  }

  if (areaId) {
    andConditions.push({
      customer: { areaId: areaId },
    });
  }

  if (feederId) {
    andConditions.push({
      customer: {
        area: { feederId: feederId },
      },
    });
  }

  if (substationId) {
    andConditions.push({
      OR: [
        { powerOperator: { substationId: substationId } },
        { customer: { area: { feeder: { substationId: substationId } } } },
      ],
    });
  }

  if (zoneId) {
    andConditions.push({
      OR: [
        { zoneManager: { zoneId: zoneId } },
        { technician: { zoneId: zoneId } },
        { powerOperator: { substation: { zoneId: zoneId } } },
        { customer: { area: { feeder: { substation: { zoneId: zoneId } } } } },
      ],
    });
  }

  if (powerAuthorityId) {
    andConditions.push({
      OR: [
        { zoneManager: { zone: { powerAuthorityId } } },
        { technician: { zone: { powerAuthorityId } } },
        { powerOperator: { substation: { zone: { powerAuthorityId } } } },
        {
          customer: {
            area: { feeder: { substation: { zone: { powerAuthorityId } } } },
          },
        },
      ],
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      customer: {
        include: {
          area: {
            include: {
              feeder: {
                include: {
                  substation: {
                    include: { zone: { include: { powerAuthority: true } } },
                  },
                },
              },
            },
          },
        },
      },
      powerOperator: {
        include: {
          substation: {
            include: {
              feeders: true,
              zone: { include: { powerAuthority: true } },
            },
          },
        },
      },
      technician: {
        include: { zone: { include: { powerAuthority: true } } },
      },
      zoneManager: {
        include: { zone: { include: { powerAuthority: true } } },
      },
    },
    omit: { password: true },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const updateUserStatusInDB = async (params: IUpdateUserStatusParams) => {
  const { adminId, adminRole, targetUserId, status } = params;

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("Target user profile not found in the grid registry!");
  }

  if (targetUser.role === Role.SUPER_ADMIN && adminRole !== Role.SUPER_ADMIN) {
    throw new Error(
      "Access Denied! Standard Administrators are unauthorized to modify a Super Administrator status.",
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      status: status,
    },
  });

  const { password, ...userWithoutPassword } = updatedUser as any;

  return userWithoutPassword;
};

export const AuthService = {
  registerUser,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateProfileInDB,
  getAllUsersFromDB,
  updateUserStatusInDB,
};
