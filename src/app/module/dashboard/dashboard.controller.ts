import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DashboardService } from "./dashboard.service";
import httpStatus from "http-status";

const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
  // ⚡ টোকেন থেকে লগইনড ইউজারের আইডি এবং রোল রিসিভ করা
  const loginUser = (req as any).user;
  const userId = (loginUser?.id || loginUser?.userId) as string;
  const role = loginUser?.role;

  if (!userId || !role) {
    throw new Error("Authentication failed! Active user sessions are missing.");
  }

  // ডাইনামিক সার্ভিস কল
  const result = await DashboardService.getDashboardOverviewFromDB(userId, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `📊 Real-time Dashboard statistics for ${role} fetched successfully.`,
    data: result,
  });
});

export const DashboardController = {
  getDashboardOverview,
};
