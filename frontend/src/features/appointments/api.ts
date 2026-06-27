import api from '@/lib/api';
import type { Appointment, AppointmentFilters, Doctor, Patient } from './types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    appointments?: T[];
    patients?: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  errors: any[];
}

export const getAppointments = async (
  filters: AppointmentFilters & { page?: number; limit?: number }
): Promise<PaginatedResponse<Appointment>> => {
  return api.get('/appointments', { params: filters });
};

export const getAppointment = async (id: string): Promise<ApiResponse<Appointment>> => {
  return api.get(`/appointments/${id}`);
};

export const createAppointment = async (
  data: Omit<Appointment, 'id' | 'status' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<Appointment>> => {
  return api.post('/appointments', data);
};

export const updateAppointment = async (
  id: string,
  data: Partial<Appointment>
): Promise<ApiResponse<Appointment>> => {
  return api.patch(`/appointments/${id}`, data);
};

export const deleteAppointment = async (id: string): Promise<ApiResponse<{ id: string }>> => {
  return api.delete(`/appointments/${id}`);
};

export const getDoctors = async (): Promise<ApiResponse<Doctor[]>> => {
  return api.get('/users', { params: { role: 'DOCTOR' } });
};

export const getPatients = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Patient>> => {
  return api.get('/patients', { params });
};
