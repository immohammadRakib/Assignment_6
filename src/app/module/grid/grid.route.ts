import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest"; 
import { GridControllers } from "./grid.controller";
import { GridValidations } from "./grid.validation";

const router = express.Router();

router.post(
  "/authority",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GridValidations.createPowerAuthorityZodSchema),
  GridControllers.createPowerAuthority,
);

router.post(
  "/zone",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GridValidations.createZoneZodSchema),
  GridControllers.createZone,
);

router.post(
  "/substation",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GridValidations.createSubstationZodSchema),
  GridControllers.createSubstation,
);

router.post(
  "/feeder",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GridValidations.createFeederZodSchema),
  GridControllers.createFeeder,
);

router.post(
  "/area",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(GridValidations.createAreaZodSchema),
  GridControllers.createArea,
);

export const GridRoutes = router;
