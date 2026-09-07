import { z } from "zod";

const initiateRechargeZodSchema = z.object({
  amount: z
    .number({
      message: "Amount is required and must be a number",
    })
    .positive("Recharge amount must be greater than 0")
    .min(1, "Minimum recharge amount is 1 unit"),
  meterNumber: z
    .string({
      message: "Meter number is required",
    })
    .min(5, "Meter number must be at least 5 characters long"),
});

const stripeCallbackZodSchema = z.object({
  userId: z.string().uuid("Invalid User ID format"),
  amount: z.string(),
  meterNumber: z.string(),
});

export const WalletValidations = {
  initiateRechargeZodSchema,
  stripeCallbackZodSchema,
};
