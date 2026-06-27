import api from '@/lib/api';
import type {
  TreatmentPlan,
  TreatmentPlansFilters,
  TreatmentPlansResponse,
  SingleTreatmentPlanResponse,
  TreatmentsResponse,
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

export const getTreatmentPlans = async (
  params?: TreatmentPlansFilters
): Promise<TreatmentPlansResponse> => {
  return api.get('/treatment-plans', { params });
};

export const getTreatmentPlan = async (id: string): Promise<SingleTreatmentPlanResponse> => {
  return api.get(`/treatment-plans/${id}`);
};

export const createTreatmentPlan = async (
  data: Omit<TreatmentPlan, 'id' | 'createdAt' | 'updatedAt' | 'patient' | 'doctor' | 'treatments'>
): Promise<SingleTreatmentPlanResponse> => {
  return api.post('/treatment-plans', data);
};

export const updateTreatmentPlan = async (
  id: string,
  data: Partial<Omit<TreatmentPlan, 'id' | 'patientId' | 'createdAt' | 'updatedAt' | 'patient' | 'doctor' | 'treatments'>>
): Promise<SingleTreatmentPlanResponse> => {
  return api.patch(`/treatment-plans/${id}`, data);
};

export const getTreatments = async (params?: {
  treatmentPlanId?: string;
  patientId?: string;
  doctorId?: string;
  page?: number;
  limit?: number;
}): Promise<TreatmentsResponse> => {
  return api.get('/treatments', { params });
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
