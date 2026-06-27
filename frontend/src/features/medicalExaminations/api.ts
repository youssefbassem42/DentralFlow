import api from '@/lib/api';
import type { MedicalExamination, PatientShort, DoctorShort } from './types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    examinations: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface PatientsPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    patients: PatientShort[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface Attachment {
  id: string;
  doctorId: string;
  fileName: string;
  filePath: string;
  fileType: 'X_Ray' | 'Prescription' | 'Images' | 'PDF';
  notes?: string | null;
  createdAt: string;
}

export const getExaminations = async (params?: {
  patientId?: string;
  doctorId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<MedicalExamination>> => {
  return api.get('/examinations', { params });
};

export const getExamination = async (id: string): Promise<ApiResponse<MedicalExamination>> => {
  return api.get(`/examinations/${id}`);
};

export const createExamination = async (
  data: Omit<MedicalExamination, 'id' | 'createdAt' | 'updatedAt' | 'patient' | 'doctor'>
): Promise<ApiResponse<MedicalExamination>> => {
  return api.post('/examinations', data);
};

export const updateExamination = async (
  id: string,
  data: Partial<Omit<MedicalExamination, 'id' | 'patientId' | 'createdAt' | 'updatedAt' | 'patient' | 'doctor'>>
): Promise<ApiResponse<MedicalExamination>> => {
  return api.patch(`/examinations/${id}`, data);
};

export const getDoctors = async (): Promise<ApiResponse<DoctorShort[]>> => {
  return api.get('/users', { params: { role: 'DOCTOR' } });
};

export const getPatients = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PatientsPaginatedResponse> => {
  return api.get('/patients', { params });
};

// Attachment integrations
export const getAttachments = async (params?: {
  doctorId?: string;
  fileType?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ attachments: Attachment[] }>> => {
  return api.get('/attachments', { params });
};

export const uploadAttachment = async (formData: FormData): Promise<ApiResponse<Attachment>> => {
  return api.post('/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAttachment = async (id: string): Promise<ApiResponse<{ id: string }>> => {
  return api.delete(`/attachments/${id}`);
};
