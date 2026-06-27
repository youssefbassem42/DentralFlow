import api from '@/lib/api';
import type {
  AttachmentsResponse,
  Doctor,
} from './types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getAttachments = async (params?: {
  page?: number;
  limit?: number;
  doctorId?: string;
  fileType?: 'X_Ray' | 'Prescription' | 'Images';
}): Promise<AttachmentsResponse> => {
  return api.get('/attachments', { params });
};

export const createAttachment = async (formData: FormData): Promise<any> => {
  return api.post('/attachments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAttachment = async (id: string): Promise<any> => {
  return api.delete(`/attachments/${id}`);
};

export const getDoctors = async (): Promise<ApiResponse<Doctor[]>> => {
  return api.get('/users', { params: { role: 'DOCTOR' } });
};

// Download attachment file by fetching as blob and triggering browser download helper
export const downloadAttachment = async (id: string, fileName: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/v1/attachments/${id}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to download file');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};
