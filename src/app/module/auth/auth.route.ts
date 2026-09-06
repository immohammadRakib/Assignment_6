import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { uploadSingle } from "../../middleware/upload";

const router = Router();

router.post(
  "/register",
  validateRequest(UserValidation.UserRegistrationZodSchema),
  AuthController.registerUser,
);
router.post(
  "/verify-email",
  validateRequest(UserValidation.UserEmailVerifyZodSchema),
  AuthController.verifyUserEmail,
);
router.post(
  "/login",
  validateRequest(UserValidation.LoginZodSchema),
  AuthController.loginUser,
);

router.get(
  "/me",
  auth(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.ZONE_MANAGER,
    Role.POWER_OPERATOR,
    Role.TECHNICIAN,
    Role.CUSTOMER,
  ),
  AuthController.getMe,
);

// router.patch(
//   "/update-profile",
//   auth(
//     Role.CUSTOMER,
//     Role.TECHNICIAN,
//     Role.ZONE_MANAGER,
//     Role.ADMIN,
//     Role.SUPER_ADMIN,
//   ),
//   validateRequest(UserValidation.UpdateProfileZodSchema),
//   AuthController.updateProfile,
// );


router.patch(
  '/update-profile', 
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ZONE_MANAGER, Role.ADMIN, Role.SUPER_ADMIN), 
  uploadSingle, 
  AuthController.updateProfile
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/google", AuthController.googleLogin);

router.post(
  "/forgot-password",
  validateRequest(UserValidation.ForgotPasswordZodSchema),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  validateRequest(UserValidation.ResetPasswordZodSchema),
  AuthController.resetPassword,
);

router.get(
  "/all-users",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  AuthController.getAllUsers,
);

router.patch(
  "/user-status/:userId",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  AuthController.updateUserStatus,
);

export const AuthRoutes = router;
