import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import express, {
  type Application,
  type Request,
  type Response,
  NextFunction,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { OutageRoutes } from "./app/module/outage/outage.route";
import { GridRoutes } from "./app/module/grid/grid.route";
import { WalletRoutes } from "./app/module/wallet/wallet.route";
import { AuditLogRoutes } from "./app/module/audit/auditLog.route";
import { DashboardRoutes } from "./app/module/dashboard/dashboard.route";
import { globalApiRateLimiter } from "./app/middleware/rateLimiter";

const app: Application = express();

app.set("trust proxy", true);

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use("/api/v1", globalApiRateLimiter);

app.use("/api/v1/auth", AuthRoutes);

app.use("/api/v1/outage", OutageRoutes);

app.use("/api/v1/wallet", WalletRoutes);

app.use("/api/v1/grid", GridRoutes);

app.use("/api/v1/auditLogs", AuditLogRoutes);

app.use("/api/v1/dashboard", DashboardRoutes);

app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 100000 > 999999 > 1000000
    const otp = crypto.randomInt(100000, 1000000); // 1, 2, 3, 4, 5, 6,7,8 ,9, 10 => X-11

    res.status(httpStatus.OK).json({
      success: true,
      message: "Welcome to Smart Power Grid Management System Backend",
      data: otp,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to Smart Power Grid Management System Backend",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
