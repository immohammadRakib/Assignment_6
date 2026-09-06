import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuditLogController } from "./auditLog.controller";

const router = express.Router();

router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  AuditLogController.getAllLogs
);

export const AuditLogRoutes = router;
