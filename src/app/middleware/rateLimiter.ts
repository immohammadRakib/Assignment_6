import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../lib/redis"; // আপনার প্রজেক্টের সঠিক রিডিস পাথ
import { Request, Response } from "express";

// 👑 গ্লোবাল এপিআই রেট লিমিট (প্রতিটি আলাদা আইপির জন্য আলাদা ট্র্যাক)
export const globalApiRateLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: "rl:global:", // Redis এ কী-এর প্রিফিক্স
  }),
  windowMs: 1 * 60 * 1000, // ১ মিনিট উইন্ডো
  max: 60, // 🛡️ ১ মিনিটে একটি নির্দিষ্ট IP থেকে সর্বোচ্চ ৬০টি রিকোয়েস্ট পাঠানো যাবে
  
  // 👑 ম্যাজিক লাইন: প্রিজমা/এক্সপ্রেসকে বাধ্য করা প্রতিটি ইউনিক আইপি আলাদাভাবে ট্র্যাক করতে
  keyGenerator: (req: Request) => {
    return (req.headers["x-forwarded-for"] as string) || req.ip || "unknown-ip";
  },
  
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: "❌ Too many requests from this IP network! Please try again after a minute.",
      error: {
        details: "Security block enforced via distributed Redis store.",
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
