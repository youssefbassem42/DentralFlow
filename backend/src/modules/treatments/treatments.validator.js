import { z } from 'zod';

export const createTreatmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  treatmentPlanId: z.string().uuid('Invalid treatment plan ID format'),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  treatmentName: z.string().min(1, 'Treatment name is required'),
  toothNumber: z.coerce
    .number()
    .int()
    .positive('Tooth number must be positive')
    .optional()
    .nullable(),
  procedure: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative('Price cannot be negative'),
  sessionDate: z.coerce.date('Invalid session date format'),
  notes: z.string().optional().nullable(),
});

export const updateTreatmentSchema = createTreatmentSchema.partial().omit({
  patientId: true,
  treatmentPlanId: true,
});

export const queryTreatmentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  patientId: z.string().uuid('Invalid patient ID format').optional(),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  treatmentPlanId: z.string().uuid('Invalid treatment plan ID format').optional(),
});

export const treatmentsValidators = {
  createTreatment: {
    body: createTreatmentSchema,
  },
  updateTreatment: {
    body: updateTreatmentSchema,
    params: z.object({
      id: z.string().uuid('Invalid treatment ID format'),
    }),
  },
  getTreatment: {
    params: z.object({
      id: z.string().uuid('Invalid treatment ID format'),
    }),
  },
  queryTreatments: {
    query: queryTreatmentsSchema,
  },
};
