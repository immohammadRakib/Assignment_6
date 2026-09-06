


import type { Role } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

// 💡 শর্টকাট ও ক্লিন রেজিস্ট্রেশন ইন্টারফেস (গুগল লগইনের সাথে সিঙ্ক করা)
export interface IRegisterUserPayload {
	name: string;
	email: string;
	password?: string; // গুগলের ক্ষেত্রে পাসওয়ার্ড থাকবে না, তাই optional (?) রাখা হয়েছে
	role: Role;        // কাস্টমার নিজে CUSTOMER সিলেক্ট করবে, অ্যাডমিন প্যানেল থেকে বাকি রোল ক্রিয়েট হবে
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
  // ১. মেইন User টেবিল থেকে মডিফাই বা আপডেট করার যোগ্য ফিল্ডসমূহ
  name?: string;
  phone?: string | null;           // রেসপন্সে 'phone' কি (Key) আছে
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null; // প্রজেক্টের জেন্ডার এনাম বা স্ট্রিং
  address?: string | null;
  profileImage?: string | null;    // পরবর্তীতে ক্লাউডিনারি ইমেজ আপলোডের লিংক সেভ করার জন্য
  
  // ২. চাইল্ড টেবিল অনবোর্ডিং ফিল্ডস (লগইন করা ইউজারের রোল অনুযায়ী সুইচে ম্যাপ হবে)
  
  // ক) কাস্টমার (CUSTOMER) প্রোফাইলের জন্য:
  areaId?: string | null;
  meterNumber?: string | null;
  accountNumber?: string;
  billingAddress?: string | null;

  // খ) টেকনিশিয়ান (TECHNICIAN) প্রোফাইলের জন্য:
  specialization?: string | null;
  
  // গ) জোন ম্যানেজার (ZONE_MANAGER) প্রোফাইলের জন্য (আপনার পোস্টম্যান অবজেক্ট অনুযায়ী):
  officeRoomNo?: string | null;    // 👈 আপনার রেসপন্সের 'officeRoomNo'
  zoneId?: string | null;          // 👈 আপনার রেসপন্সের 'zoneId' (জোন ম্যাপ করার জন্য)
}

export interface IUserQueryFilters {
  searchTerm?: string;
  role?: Role;
  areaId?: string;
  feederId?: string;           // 💡 নতুন: নির্দিষ্ট ফিডার লাইনের ইউজার খোঁজা
  substationId?: string;       // সাবস্টেশন ফিল্টার
  zoneId?: string;             // জোন ফিল্টার
  powerAuthorityId?: string;   // পাওয়ার অথরিটি ফিল্টার
}
