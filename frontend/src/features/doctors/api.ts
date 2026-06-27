import api from '@/lib/api';

export interface DoctorUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface DoctorsResponse {
  success: boolean;
  message: string;
  data: DoctorUser[];
}

export const getDoctors = async (): Promise<DoctorsResponse> => {
  return api.get('/users', {
    params: {
      role: 'DOCTOR',
    },
  });
};
