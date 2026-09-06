import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";
import { UserStatus } from "../../../generated/prisma/browser";

const registerPatient = catchAsync(async (req: Request, res: Response) => {
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
			profile
		},
	});
});

const verifyPatientEmail = catchAsync(async (req: Request, res: Response) => {

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
			profile
		}
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
	
	const payload = req.body
	const result = await AuthService.googleLogin(payload)
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
			refreshToken
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



const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user; // JWT ভেরিফিকেশন মিডলওয়্যার থেকে আসা সেশন ইউজার

  const userId = user?.id || user?.userId;
  const role = user?.role;

  if (!userId || !role) {
    throw new Error("Authentication failed! Active user session contexts are missing.");
  }

  // বডি থেকে আসা টাইপ-সেফ পে-লোড নিয়ে সার্ভিস লেয়ার কল করা
  const result = await AuthService.updateProfileInDB(userId, role, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User and core structural profile synchronized and updated successfully!",
    data: result
  });
});


const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  
  // 💡 ১. আপারকেস এবং লোয়ারকেস এরর হ্যান্ডেলিং লেয়ার (Defensive Guard)
  const incomingRole = req.query.role as string;
  let normalizedRole: any = undefined;

  if (incomingRole) {
    // যেকোনো স্পেস কেটে দিয়ে পুরো স্ট্রিং বড় হাতের (UPPERCASE) বানিয়ে ফেলা
    const uppercaseRole = incomingRole.trim().toUpperCase();
    
    // ডাটাবেস এনামের ভ্যালিড লিস্ট ম্যাচিং চেক করা
    const validRoles = ["CUSTOMER", "TECHNICIAN", "POWER_OPERATOR", "ZONE_MANAGER", "ADMIN", "SUPER_ADMIN"];
    
    if (validRoles.includes(uppercaseRole)) {
      normalizedRole = uppercaseRole; // এটি এখন ডাটাবেস কুয়েরির জন্য ১০০% সেফ
    } else {
      // 👑 ভুল রোল টাইপ করলে সার্ভার ক্র্যাশ না করিয়ে কাস্টমারকে সুন্দর এরর মেসেজ পাঠানো
      throw new Error(`Invalid role filter: '${incomingRole}'. Valid profiles are: ${validRoles.join(", ")}`);
    }
  }

  // ২. কুয়েরি প্যারামস থেকে সম্পূর্ণ গ্রিড হায়ারার্কি ফিল্টার রিসিভ
  const filters = {
    searchTerm: req.query.searchTerm as string,
    role: normalizedRole, // 👈 এটি এখন সব সময় বড় হাতের টাইপ-সেফ এনাম ভ্যালু পাস করবে
    areaId: req.query.areaId as string,
    feederId: req.query.feederId as string,               
    substationId: req.query.substationId as string,       
    zoneId: req.query.zoneId as string,
    powerAuthorityId: req.query.powerAuthorityId as string, 
  };

  // ৩. প্যাজিনেশন এবং সর্টিং (ডিফোল্ট লিমিট ৫ সচল)
  const options = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as any,
  };

  // সার্ভিস লেয়ার এক্সিকিউশন
  const result = await AuthService.getAllUsersFromDB(filters, options);

  // 👑 ৪. মেটা ডেটাকে ওপরে (Top Layer) সাজিয়ে রেসপন্স পাঠানো
  // (মনে রাখবেন আপনার sendResponse ইউটিলিটি ফাইলের ভেতরেও 'meta' প্রোপার্টিটি 'message' এর ওপরে রাখতে হবে)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    meta: {
      page: Number(result.meta.page),
      limit: Number(result.meta.limit),
      total: Number(result.meta.total),
      totalPages: Number(result.meta.totalPage || (result.meta as any).totalPages) // দুই ধরণের স্পেলিং সেফটি হ্যান্ডেল করা হলো
    },
    message: "Flawless hierarchical grid user registry compiled and fetched successfully!",
    data: result.data,
  });
});



const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const admin = (req as any).user; // JWT মিডলওয়্যার থেকে আসা লগইনড অ্যাডমিন সেশন
  const { userId } = req.params;   // ইউআরএল প্যারামস থেকে টার্গেট ইউজারের আইডি
  
  const incomingStatus = req.body.status as string;
  if (!incomingStatus) {
    throw new Error("User status field ('status') is required in request body!");
  }

  // 👑 কেস-সেনসিটিভিটি ফিক্স: স্ট্যাটাসটিকে ট্রিম ও বড় হাতের (UPPERCASE) বানিয়ে নেওয়া
  const cleanStatus = incomingStatus.trim().toUpperCase();
  
  // ভ্যালিড প্রিজমা এনাম চেক
  if (cleanStatus !== "ACTIVE" && cleanStatus !== "BLOCKED") {
    throw new Error("Invalid status type! Allowed values are strictly 'ACTIVE' or 'BLOCKED'.");
  }

  // ⚡ সার্ভিস লেয়ার এক্সিকিউশন (ইন্টারফেসের সাথে মিলিয়ে অবজেক্ট আকারে ডাটা পাঠানো হলো)
  const result = await AuthService.updateUserStatusInDB({
    adminId: admin.id || admin.userId,
    adminRole: admin.role,
    targetUserId: userId as string,
    status: cleanStatus as UserStatus // টাইপ-সেফ এনাম কাস্টিং
  });

  // স্ট্যান্ডার্ড রেসপন্স
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User system account status has been successfully updated to ${cleanStatus}!`,
    data: result
  });
});



export const AuthController = {
	registerPatient,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
	verifyPatientEmail,
	updateProfile,
	getAllUsers,
	updateUserStatus
};
