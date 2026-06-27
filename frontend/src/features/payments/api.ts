import api from '@/lib/api';
import type {
  Payment,
  PaymentsFilters,
  PaymentsResponse,
  PatientFinancialResponse,
  Patient,
  Doctor,
} from './types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PatientsPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    patients: Patient[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const getPayments = async (params?: PaymentsFilters): Promise<PaymentsResponse> => {
  return api.get('/payments', { params });
};

export const createPayment = async (
  data: Omit<Payment, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'patient' | 'doctor'> & { invoiceNumber?: string }
): Promise<ApiResponse<Payment>> => {
  return api.post('/payments', data);
};

export const getPatientFinancial = async (patientId: string): Promise<PatientFinancialResponse> => {
  return api.get(`/patients/${patientId}/financial`);
};

export const getPatients = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PatientsPaginatedResponse> => {
  return api.get('/patients', { params });
};

export const getDoctors = async (): Promise<ApiResponse<Doctor[]>> => {
  return api.get('/users', { params: { role: 'DOCTOR' } });
};
