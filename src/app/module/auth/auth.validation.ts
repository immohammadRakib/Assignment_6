import z from "zod";

const UserRegistrationZodSchema = z.object({
  name: z.string().min(3, "Name must atleast 3 characters long!!!").max(30),
  email: z.string().email("Not email!!"),
  password: z
    .string()
    .min(8, "Password Must Minimum 8 Characters Long.")
    .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
    .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")
    .regex(/[0-9]/, "Password must contain atleast 1 Number")
    .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
  role: z.string().min(1, "Role is required!!!"),
});

const UserEmailVerifyZodSchema = z.object({
  email: z.string().email("Not email!!"),
  otp: z.string().length(6),
});

const LoginZodSchema = z.object({
  email: z.string().email("Not email!!"),
  password: z
    .string()
    .min(8, "Password Must Minimum 8 Characters Long.")
    .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
    .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")
    .regex(/[0-9]/, "Password must contain atleast 1 Number")
    .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
});

const ForgotPasswordZodSchema = z.object({
  email: z.string().email("Not email!!"),
});

const ResetPasswordZodSchema = z.object({
  email: z.string().email("Not email!!"),
  newPassword: z
    .string()
    .min(8, "Password Must Minimum 8 Characters Long.")
    .regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
    .regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")
    .regex(/[0-9]/, "Password must contain atleast 1 Number")
    .regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
  otp: z.string().length(6),
});

const UpdateProfileZodSchema = z.object({
  name: z.string().min(3).max(40).optional(),
  phone: z.string().nullable().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
  address: z.string().nullable().optional(),
  profileImage: z
    .string()
    .url("Invalid Image URL format")
    .nullable()
    .optional(),

  areaId: z.string().uuid("Invalid Area UUID").nullable().optional(),
  meterNumber: z.string().optional(),
  zoneId: z.string().uuid("Invalid Zone UUID").nullable().optional(),
  officeRoomNo: z.string().nullable().optional(),
  specialization: z.string().nullable().optional(),
});

export const UserValidation = {
  UserRegistrationZodSchema,
  UserEmailVerifyZodSchema,
  LoginZodSchema,
  ForgotPasswordZodSchema,
  ResetPasswordZodSchema,
  UpdateProfileZodSchema,
};
