import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST']),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  shift: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  shift: z.string().optional(),
});

export const usersValidators = {
  createUser: {
    body: createUserSchema,
  },
  updateUser: {
    body: updateUserSchema,
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
    }),
  },
  getUser: {
    params: z.object({
      id: z.string().uuid('Invalid user ID format'),
    }),
  },
};
