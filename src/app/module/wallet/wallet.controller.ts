import { Request, Response } from "express";
import { WalletService } from "./wallet.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";

const getMyBalance = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const userId = user?.id || user?.userId || req.query.userId;

  if (!userId) {
    throw new Error("Authentication failed! User ID not found.");
  }

  const result = await WalletService.getCustomerBalance(userId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: {
      balance: result.balance,
    },
  });
});

const rechargeMeter = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const payload = {
    userId: (user?.id || user?.userId) as string,
    amount: Number(req.body.amount),
    meterNumber: req.body.meterNumber,
  };

  if (!payload.userId && req.body.userId) {
    payload.userId = req.body.userId;
  }

  if (!payload.userId) {
    throw new Error("Authentication failed! User ID not found in token.");
  }

  const result = await WalletService.createCheckoutSession(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: {
      paymentUrl: result.paymentUrl,
    },
  });
});

const handleStripeSuccess = catchAsync(async (req: Request, res: Response) => {
  const { userId, amount, meterNumber } = req.query;

  await WalletService.rechargeMeterBalance({
    userId: userId as string,
    amount: Number(amount),
    meterNumber: meterNumber as string,
  });

  res.send(`
    <div style="text-align: center; margin-top: 120px; font-family: sans-serif;">
      <div style="display: inline-block; background: #e8f8f5; padding: 25px; border-radius: 50%; margin-bottom: 15px;">
        <span style="font-size: 50px; color: #2ecc71;">⚡</span>
      </div>
      <h1 style="color: #2ecc71; font-size: 32px; margin-bottom: 10px;">Payment & Meter Recharge Successful!</h1>
      <p style="color: #7f8c8d; font-size: 18px; margin-bottom: 30px;">BDT/USD ${amount} has been securely credited to Meter No: <strong>${meterNumber}</strong></p>
      <a href="http://localhost:3000/dashboard" style="padding: 12px 25px; background: #3498db; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-family: sans-serif;">Back to Grid Dashboard</a>
    </div>
  `);
});

const handleStripeCancel = catchAsync(async (req: Request, res: Response) => {
  res.send(`
    <div style="text-align: center; margin-top: 120px; font-family: sans-serif;">
      <h1 style="color: #e74c3c;">❌ Payment Cancelled or Failed!</h1>
      <p>The transaction was aborted. No amount was deducted from your card.</p>
      <a href="http://localhost:3000/dashboard" style="color: #3498db; text-decoration: none; font-weight: bold;">Try Again</a>
    </div>
  `);
});


const getPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  // টোকেন থেকে রিয়াল-টাইম কনটেক্সট রিসিভ করা ⚡
  const loginUser = (req as any).user;
  const userId = (loginUser?.id || loginUser?.userId) as string;
  const role = loginUser?.role as string;

  // কুয়েরি থেকে ফিল্টার আলাদা করা
  const filters = {
    searchTerm: req.query.searchTerm as string,
    status: req.query.status as string,
  };

  // পেজিনেশন অপশন
  const options = {
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  };

  const result = await WalletService.getPaymentHistoryFromDB(userId, role, filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "💳 Payment transaction history logs fetched successfully.",
    data: result,
  });
});

export const WalletController = {
  rechargeMeter,
  getMyBalance,
  handleStripeSuccess,
  handleStripeCancel,
  getPaymentHistory
};
