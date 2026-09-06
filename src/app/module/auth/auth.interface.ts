import type { Role, UserStatus } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IRegisterUserPayload {
  name: string;
  email: string;
  password?: string;
  role: Role;
}

export interface IVerifyEmailPayload {
  email: string;
  otp: string;
}

export interface IRequestUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface IGoogleLogin {
  idToken: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  email: string;
  newPassword: string;
  otp: string;
}

export interface IUpdateProfilePayload {
  name?: string;
  phone?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  address?: string | null;
  profileImage?: string | null;

  areaId?: string | null;
  meterNumber?: string | null;
  accountNumber?: string;
  billingAddress?: string | null;
  specialization?: string | null;
  officeRoomNo?: string | null;
  zoneId?: string | null;
}

export interface IUserQueryFilters {
  searchTerm?: string;
  role?: Role;
  areaId?: string;
  feederId?: string;
  substationId?: string;
  zoneId?: string;
  powerAuthorityId?: string;
}

export interface IUpdateUserStatusPayload {
  status: string;
}

export interface IUpdateUserStatusParams {
  adminId: string;
  adminRole: string;
  targetUserId: string;
  status: UserStatus;
}
