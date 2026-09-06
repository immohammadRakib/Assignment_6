export interface IMeterRechargePayload {
  userId: string; 
  amount: number;
  meterNumber: string;
}

export interface IWalletResponse {
  success: boolean;
  message: string;
  balance?: number;
}

export interface IWalletResponse {
  success: boolean;
  message: string;
  balance?: number;
  paymentUrl?: string; 
}

export interface IPaymentFilterableFields {
  searchTerm?: string;
  status?: string; 
}
