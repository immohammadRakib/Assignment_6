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

export interface IOutageResolveResponse {
  success: boolean;
  message: string;
  report: any; 
}


export interface IManualAssignmentResponse {
  success: boolean;
  message: string;
  report: any;
}

export interface ITechnicianFilterableFields {
  searchTerm?: string;
  status?: string;
  zoneId?: string;
}


export interface IOutageReportFilterableFields {
  searchTerm?: string;
  status?: string;
  areaId?: string;
}
