import api from '@/lib/api';
import type { AuthResponse, LoginCredentials } from './types';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return api.post('/auth/login', credentials);
};
