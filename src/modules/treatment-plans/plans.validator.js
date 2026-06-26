import { z } from 'zod';

export const createTreatmentPlanSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  title: z.string().min(2, 'Title must be at least 2 characters long'),
  description: z.string().optional().nullable(),
  estimatedCost: z.coerce.number().nonnegative('Estimated cost cannot be negative'),
  estimatedSessions: z.coerce.number().int().positive('Estimated sessions must be at least 1'),
});

export const updateTreatmentPlanSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters long').optional(),
  description: z.string().optional().nullable(),
  estimatedCost: z.coerce.number().nonnegative('Estimated cost cannot be negative').optional(),
  estimatedSessions: z.coerce
    .number()
    .int()
    .positive('Estimated sessions must be at least 1')
    .optional(),
  status: z.enum(['Pending', 'InProgress', 'Completed', 'Cancelled']).optional(),
});

export const queryTreatmentPlansSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  patientId: z.string().uuid('Invalid patient ID format').optional(),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  status: z.enum(['Pending', 'InProgress', 'Completed', 'Cancelled']).optional(),
});

export const plansValidators = {
  createPlan: {
    body: createTreatmentPlanSchema,
  },
  updatePlan: {
    body: updateTreatmentPlanSchema,
    params: z.object({
      id: z.string().uuid('Invalid treatment plan ID format'),
    }),
  },
  getPlan: {
    params: z.object({
      id: z.string().uuid('Invalid treatment plan ID format'),
    }),
  },
  queryPlans: {
    query: queryTreatmentPlansSchema,
  },
};
