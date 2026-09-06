import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { OutageController } from "./outage.controller";
import { OutageValidations } from "./outage.validation";

const router = express.Router();

router.post(
  "/report",
  auth(Role.CUSTOMER),
  validateRequest(OutageValidations.reportUnexpectedOutageZodSchema),
  OutageController.reportUnexpectedOutage,
);

router.post(
  "/schedule",
  auth(Role.POWER_OPERATOR, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(OutageValidations.createScheduledOutageZodSchema),
  OutageController.createScheduledOutage,
);

router.patch(
  "/resolve/:reportId",
  auth(Role.TECHNICIAN),
  validateRequest(OutageValidations.resolveOutageJobZodSchema),
  OutageController.resolveOutageJob,
);

router.get(
  "/schedule-list",
  auth(
    Role.CUSTOMER,
    Role.TECHNICIAN,
    Role.ZONE_MANAGER,
    Role.POWER_OPERATOR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  ),
  OutageController.getAllScheduledOutages,
);

router.patch(
  "/assign-technician",
  auth(Role.ZONE_MANAGER, Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(OutageValidations.assignTechnicianManuallyZodSchema),
  OutageController.assignTechnicianManually,
);

export const OutageRoutes = router;
