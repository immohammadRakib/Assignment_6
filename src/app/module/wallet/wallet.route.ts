import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { WalletController } from "./wallet.controller";
import { WalletValidations } from "./wallet.validation";

const router = express.Router();

router.get("/my-balance", auth(Role.CUSTOMER), WalletController.getMyBalance);

router.post(
  "/recharge",
  auth(Role.CUSTOMER),
  validateRequest(WalletValidations.initiateRechargeZodSchema),
  WalletController.rechargeMeter,
);

router.get(
  "/stripe-success",
  validateRequest(WalletValidations.stripeCallbackZodSchema),
  WalletController.handleStripeSuccess,
);

router.get("/stripe-cancel", WalletController.handleStripeCancel);

router.get(
  "/history",
  auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
  WalletController.getPaymentHistory
);

export const WalletRoutes = router;
