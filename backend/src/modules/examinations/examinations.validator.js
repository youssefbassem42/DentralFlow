import { z } from 'zod';

export const createExaminationSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  clinicalNotes: z.string().optional().nullable(),
  radiologyNotes: z.string().optional().nullable(),
  prescription: z.string().optional().nullable(),
  recommendations: z.string().optional().nullable(),
  examDate: z.coerce.date().optional(),
});

export const updateExaminationSchema = createExaminationSchema.partial().omit({
  patientId: true, // Patient ID cannot be changed once recorded
});

export const queryExaminationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  patientId: z.string().uuid('Invalid patient ID format').optional(),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
});

export const examinationsValidators = {
  createExamination: {
    body: createExaminationSchema,
  },
  updateExamination: {
    body: updateExaminationSchema,
    params: z.object({
      id: z.string().uuid('Invalid examination ID format'),
    }),
  },
  getExamination: {
    params: z.object({
      id: z.string().uuid('Invalid examination ID format'),
    }),
  },
  queryExaminations: {
    query: queryExaminationSchema,
  },
};
