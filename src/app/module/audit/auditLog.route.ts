import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuditLogController } from "./auditLog.controller";

const router = express.Router();

// 🛡️ শুধুমাত্র এডমিন ও সুপার এডমিন পুরো সিস্টেমের ক্রিয়াকলাপের ইতিহাস দেখতে পারবে
router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  AuditLogController.getAllLogs
);

export const AuditLogRoutes = router;
