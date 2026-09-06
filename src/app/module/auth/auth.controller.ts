import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";

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
  
  // ১. কুয়েরি প্যারামস থেকে সম্পূর্ণ গ্রিড হায়ারার্কি ফিল্টার রিসিভ
  const filters = {
    searchTerm: req.query.searchTerm as string,
    role: req.query.role as any,
    areaId: req.query.areaId as string,
    feederId: req.query.feederId as string,               // 💡 নতুন: ফিডার লাইন ফিল্টার
    substationId: req.query.substationId as string,       
    zoneId: req.query.zoneId as string,
    powerAuthorityId: req.query.powerAuthorityId as string, 
  };

  // ২. প্যাজিনেশন এবং সর্টিং (ডিফোল্ট লিমিট ৫ সচল)
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
  message: "Flawless hierarchical grid user registry compiled and fetched successfully!",
  meta: {
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
    totalPages: result.meta.totalPage // 👈 সার্ভিসের totalPage কে ইন্টারফেসের totalPages এ ম্যাপ করে দিলেন
  },
  data: result.data,
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
	getAllUsers
};
