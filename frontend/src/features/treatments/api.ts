import api from '@/lib/api';
import type {
  Treatment,
  TreatmentFilters,
  TreatmentsResponse,
  SingleTreatmentResponse,
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

export interface TreatmentPlansListResponse {
  success: boolean;
  message: string;
  data: {
    plans: Array<{
      id: string;
      title: string;
      status: string;
      patientId: string;
    }>;
  };
}

export const getTreatments = async (params?: TreatmentFilters): Promise<TreatmentsResponse> => {
  return api.get('/treatments', { params });
};

export const getTreatment = async (id: string): Promise<SingleTreatmentResponse> => {
  return api.get(`/treatments/${id}`);
};

export const createTreatment = async (
  data: Omit<Treatment, 'id' | 'createdAt' | 'updatedAt' | 'patient' | 'doctor' | 'treatmentPlan'>
): Promise<SingleTreatmentResponse> => {
  return api.post('/treatments', data);
};

export const updateTreatment = async (
  id: string,
  data: Partial<Omit<Treatment, 'id' | 'patientId' | 'treatmentPlanId' | 'createdAt' | 'updatedAt' | 'patient' | 'doctor' | 'treatmentPlan'>>
): Promise<SingleTreatmentResponse> => {
  return api.patch(`/treatments/${id}`, data);
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

// Retrieve active/pending treatment plans for a specific patient to select from when recording a treatment
export const getTreatmentPlans = async (params?: {
  patientId?: string;
  status?: string;
}): Promise<TreatmentPlansListResponse> => {
  return api.get('/treatment-plans', { params });
};
