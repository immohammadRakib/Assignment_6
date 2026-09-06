import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";
import { UserStatus } from "../../../generated/prisma/browser";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.registerUser(payload);

  const { accessToken, refreshToken, user, profile } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully",
    data: {
      accessToken,
      refreshToken,
      user,
      profile,
    },
  });
});

const verifyUserEmail = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await AuthService.verifyEmail(payload);

  const { accessToken, refreshToken, user, profile } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Email Verified Successfully",
    data: {
      accessToken,
      refreshToken,
      user,
      profile,
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.loginUser(payload);
  const { accessToken, refreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as unknown as IRequestUser;

  if (!user) {
    throw new Error("User information is missing in the request");
  }

  const result = await AuthService.getMe(user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  if (!req.cookies.refreshToken) {
    throw new Error("Refresh token is missing");
  }
  const result = await AuthService.refreshToken(req.cookies.refreshToken);
  const { accessToken, refreshToken: newRefreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthService.googleLogin(payload);
  const { accessToken, refreshToken } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New tokens generated successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthService.forgotPassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `OTP Sent To Email : ${payload.email}`,
    data: null,
  });
});
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await AuthService.resetPassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Changed Successfully",
    data: null,
  });
});

const updateProfile = catchAsync(async (req: any, res: Response) => {
  const user = req.user;

  const userId = user?.id || user?.userId;
  const role = user?.role;

  if (!userId || !role) {
    throw new Error(
      "Authentication failed! Active user session contexts are missing.",
    );
  }

  const payload = { ...req.body };

  if (req.file?.path) {
    payload.profileImage = req.file.path;
  }

  const result = await AuthService.updateProfileInDB(userId, role, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "User and core structural profile synchronized and updated successfully!",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const incomingRole = req.query.role as string;
  let normalizedRole: any = undefined;

  if (incomingRole) {
    const uppercaseRole = incomingRole.trim().toUpperCase();

    const validRoles = [
      "CUSTOMER",
      "TECHNICIAN",
      "POWER_OPERATOR",
      "ZONE_MANAGER",
      "ADMIN",
      "SUPER_ADMIN",
    ];

    if (validRoles.includes(uppercaseRole)) {
      normalizedRole = uppercaseRole;
    } else {
      throw new Error(
        `Invalid role filter: '${incomingRole}'. Valid profiles are: ${validRoles.join(", ")}`,
      );
    }
  }

  const filters = {
    searchTerm: req.query.searchTerm as string,
    role: normalizedRole,
    areaId: req.query.areaId as string,
    feederId: req.query.feederId as string,
    substationId: req.query.substationId as string,
    zoneId: req.query.zoneId as string,
    powerAuthorityId: req.query.powerAuthorityId as string,
  };

  const options = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as any,
  };

  const result = await AuthService.getAllUsersFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    meta: {
      page: Number(result.meta.page),
      limit: Number(result.meta.limit),
      total: Number(result.meta.total),
      totalPages: Number(
        result.meta.totalPage || (result.meta as any).totalPages,
      ),
    },
    message:
      "Flawless hierarchical grid user registry compiled and fetched successfully!",
    data: result.data,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { userId } = req.params;

  const incomingStatus = req.body.status as string;
  if (!incomingStatus) {
    throw new Error(
      "User status field ('status') is required in request body!",
    );
  }

  const cleanStatus = incomingStatus.trim().toUpperCase();

  if (cleanStatus !== "ACTIVE" && cleanStatus !== "BLOCKED") {
    throw new Error(
      "Invalid status type! Allowed values are strictly 'ACTIVE' or 'BLOCKED'.",
    );
  }

  const result = await AuthService.updateUserStatusInDB({
    adminId: admin.id || admin.userId,
    adminRole: admin.role,
    targetUserId: userId as string,
    status: cleanStatus as UserStatus,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User system account status has been successfully updated to ${cleanStatus}!`,
    data: result,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
  verifyUserEmail,
  updateProfile,
  getAllUsers,
  updateUserStatus,
};
