import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../lib/redis";
import { Request, Response } from "express";

export const globalApiRateLimiter = rateLimit({
  // store: new RedisStore({
  //   sendCommand: async (...args: string[]) => {
  //     if (!redisClient.isOpen) {
  //       await redisClient.connect();
  //     }
  //     return redisClient.sendCommand(args);
  //   },
  //   prefix: "rl:global:",
  // }),
  windowMs: 1 * 60 * 1000,
  max: 60,

  keyGenerator: (req: Request): string => {
    const ip =
      (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      return "127.0.0.1";
    }
    return ip;
  },

  validate: {
    xForwardedForHeader: false,
    default: false,
  },

  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message:
        "Too many requests from this IP network! Please try again after a minute.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
