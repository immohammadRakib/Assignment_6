import { z } from "zod";

const initiateRechargeZodSchema = z.object({
  // 💡 বাইরের 'body:' লেয়ারটি বাদ দেওয়া হলো কারণ মিডলওয়্যার সরাসরি বডির ভেতরের ডাটা পাঠায়
  amount: z
    .number({ 
      message: "Amount is required and must be a number" 
    })
    .positive("Recharge amount must be greater than 0")
    .min(1, "Minimum recharge amount is 1 unit"),
  meterNumber: z
    .string({
      message: "Meter number is required",
    })
    .min(5, "Meter number must be at least 5 characters long"),
});

// স্ট্রাইপ কলব্যাকের ক্ষেত্রেও একই নিয়ম (যদি কলব্যাক রাউটে আপনি validateRequest ব্যবহার করেন)
const stripeCallbackZodSchema = z.object({
  userId: z.string().uuid("Invalid User ID format"),
  amount: z.string(),
  meterNumber: z.string(),
});

export const WalletValidations = {
  initiateRechargeZodSchema,
  stripeCallbackZodSchema,
};
