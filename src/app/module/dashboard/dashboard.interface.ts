// ১. কাস্টমার ড্যাশবোর্ড ইন্টারফেস
export interface ICustomerDashboardData {
  role: "CUSTOMER";
  currentBalance: number;
  meterNumber: string;
  isPowerActive: boolean;
  myPendingComplaints: number;
  myResolvedComplaints: number;
}

// ২. পাওয়ার অপারেটর ড্যাশবোর্ড ইন্টারফেস
export interface IOperatorDashboardData {
  role: "POWER_OPERATOR";
  totalMyFeeders: number;
  activeSchedulesUnderMe: number;
  operatorSubstationId: string;
}

// 👑 ৩. জোন ম্যানেজার ড্যাশবোর্ড ইন্টারফেস (সম্পূর্ণ আলাদা)
export interface IZoneManagerDashboardData {
  role: "ZONE_MANAGER";
  zoneId: string;
  totalCustomers: number;
  totalTechnicians: number;
  activeLoadShedding: number;
  pendingComplaints: number;
}

// 👑 ৪. এডমিন এবং সুপার এডমিন ড্যাশবোর্ড ইন্টারফেস (আপডেটেড)
export interface IAdminDashboardData {
  role: "ADMIN" | "SUPER_ADMIN";
  totalCustomers: number;
  totalTechnicians: number;
  totalZoneManagers: number; // 👈 অ্যারো ডাটা টাইপ
  totalPowerOperators: number; // 👈 অ্যারো ডাটা টাইপ
  activeLoadShedding: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  totalRevenue: number;
  gridHealthScore: string;
}

// গ্লোবাল রেসপন্স ইন্টারফেস
export interface IDashboardOverviewResponse {
  success: boolean;
  message: string;
  data: ICustomerDashboardData | IOperatorDashboardData | IZoneManagerDashboardData | IAdminDashboardData;
}
