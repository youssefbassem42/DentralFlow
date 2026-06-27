import api from '@/lib/api';
import type { User } from '@/features/authentication/types';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const updateProfile = async (
  id: string | number,
  data: {
    name?: string;
    email?: string;
    phone?: string | null;
    password?: string;
  }
): Promise<ApiResponse<User>> => {
  return api.patch(`/users/${id}`, data);
};
