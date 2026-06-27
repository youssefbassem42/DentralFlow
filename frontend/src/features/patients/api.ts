import api from '@/lib/api';
import type {
  Patient,
  PatientFilters,
  PatientResponse,
  PatientProfileResponse,
} from './types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getPatients = async (params?: PatientFilters): Promise<PatientResponse> => {
  return api.get('/patients', {
    params,
  });
};

export const getPatientById = async (id: string): Promise<ApiResponse<Patient>> => {
  return api.get(`/patients/${id}`);
};

export const getPatientProfile = async (id: string): Promise<PatientProfileResponse> => {
  return api.get(`/patients/${id}/profile`);
};

export const createPatient = async (
  data: Omit<Patient, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'creator' | 'balance' | 'lastVisit' | 'nextAppointment' | 'status'>
): Promise<ApiResponse<Patient>> => {
  return api.post('/patients', data);
};

export const updatePatient = async (
  id: string,
  data: Partial<Omit<Patient, 'id' | 'createdBy' | 'createdAt' | 'updatedAt' | 'creator' | 'balance' | 'lastVisit' | 'nextAppointment' | 'status'>>
): Promise<ApiResponse<Patient>> => {
  return api.patch(`/patients/${id}`, data);
};

export const deletePatient = async (id: string): Promise<ApiResponse<{ id: string }>> => {
  return api.delete(`/patients/${id}`);
};
