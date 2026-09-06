export interface IAuditLogFilterableFields {
  searchTerm?: string;
  action?: string;
}

export interface IAuditLogResponse {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    role: string;
  };
}
