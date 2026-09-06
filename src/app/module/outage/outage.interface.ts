export interface IScheduledOutagePayload {
  areaId: string;
  startTime: string; 
  endTime: string;
  reason?: string;  
}

export interface IReportOutagePayload {
  customerId: string;
  areaId: string;
  description?: string;
}

export interface IResolveJobPayload {
  reportId: string;
  notes?: string;
}

export interface IOutageResponse {
  success: boolean;
  message: string;
  outage?: any;
  report?: any;
  assignedTechnicianId?: string;
}
