export interface ICustomerDashboardData {
  role: "CUSTOMER";
  currentBalance: number;
  meterNumber: string;
  isPowerActive: boolean;
  myPendingComplaints: number;
  myResolvedComplaints: number;
}

export interface IOperatorDashboardData {
  role: "POWER_OPERATOR";
  totalMyFeeders: number;
  activeSchedulesUnderMe: number;
  operatorSubstationId: string;
}

export interface IZoneManagerDashboardData {
  role: "ZONE_MANAGER";
  zoneId: string;
  totalCustomers: number;
  totalTechnicians: number;
  activeLoadShedding: number;
  pendingComplaints: number;
}

export interface IAdminDashboardData {
  role: "ADMIN" | "SUPER_ADMIN";
  totalCustomers: number;
  totalTechnicians: number;
  totalZoneManagers: number; 
  totalPowerOperators: number; 
  activeLoadShedding: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  totalRevenue: number;
  gridHealthScore: string;
}

export interface IDashboardOverviewResponse {
  success: boolean;
  message: string;
  data: ICustomerDashboardData | IOperatorDashboardData | IZoneManagerDashboardData | IAdminDashboardData;
}
