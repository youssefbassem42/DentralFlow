import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export interface User {
  id: string | number;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}
