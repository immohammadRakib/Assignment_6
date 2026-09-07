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

router.delete(
  "/area/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN), 
  GridControllers.softDeleteArea
);

router.get(
  "/zone",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.ZONE_MANAGER, Role.POWER_OPERATOR),
  GridControllers.getAllZones,
);

router.get(
  "/substation",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.ZONE_MANAGER, Role.POWER_OPERATOR),
  GridControllers.getAllSubstations,
);

router.get(
  "/feeder",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.ZONE_MANAGER, Role.POWER_OPERATOR),
  GridControllers.getAllFeeders,
);

router.get(
  "/area",
  auth(Role.ADMIN, Role.SUPER_ADMIN, Role.CUSTOMER, Role.ZONE_MANAGER, Role.POWER_OPERATOR),
  GridControllers.getAllAreas,
);


export const GridRoutes = router;
