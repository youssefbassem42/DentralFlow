export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

export interface Payment {
  id: string;
  patientId: string;
  doctorId: string;
  amount: number | string;
  paymentMethod: 'Cash' | 'Visa' | 'Insurance' | 'Wallet';
  invoiceNumber: string;
  notes: string | null;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  doctor?: Doctor & { user?: { name: string } };
}

export interface RevenueSummary {
  totalRevenue: number;
  breakdown: {
    Cash: number;
    Visa: number;
    Insurance: number;
    Wallet: number;
  };
}

export interface PaymentsFilters {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  paymentMethod?: 'Cash' | 'Visa' | 'Insurance' | 'Wallet';
}

export interface PaymentsResponse {
  success: boolean;
  message: string;
  data: {
    payments: Payment[];
    summary: RevenueSummary;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface PatientFinancialResponse {
  success: boolean;
  message: string;
  data: {
    patientId: string;
    totalInvoiced: number;
    totalPaid: number;
    balance: number;
    payments: Payment[];
    treatments: Array<{
      id: string;
      treatmentName: string;
      price: number | string;
      sessionDate: string;
      procedure: string | null;
    }>;
  };
}
