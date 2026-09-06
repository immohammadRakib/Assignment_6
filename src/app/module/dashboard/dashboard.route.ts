import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { DashboardController } from "./dashboard.controller";

const router = express.Router();

router.get(
  "/overview",
  auth(
    Role.CUSTOMER,
    Role.POWER_OPERATOR,
    Role.ZONE_MANAGER,
    Role.ADMIN,
    Role.SUPER_ADMIN
  ),
  DashboardController.getDashboardOverview
);

export const DashboardRoutes = router;
