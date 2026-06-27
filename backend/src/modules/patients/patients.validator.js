import { z } from 'zod';

export const createPatientSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.coerce.date({ invalid_type_error: 'Invalid date of birth format' }),
  phone: z.string().min(5, 'Phone number must be at least 5 characters long'),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const queryPatientSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  doctorId: z.string().uuid().optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  lastVisit: z.enum(['last30Days', 'last6Months', 'anyTime']).optional(),
});

export const patientsValidators = {
  createPatient: {
    body: createPatientSchema,
  },
  updatePatient: {
    body: updatePatientSchema,
    params: z.object({
      id: z.string().uuid('Invalid patient ID format'),
    }),
  },
  getPatient: {
    params: z.object({
      id: z.string().uuid('Invalid patient ID format'),
    }),
  },
  queryPatients: {
    query: queryPatientSchema,
  },
};
