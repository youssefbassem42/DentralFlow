import { z } from 'zod';

export const createAttachmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  fileType: z.enum(['X_Ray', 'Prescription', 'Images'], {
    errorMap: () => ({ message: 'FileType must be X_Ray, Prescription, or Images' }),
  }),
  notes: z.string().optional().nullable(),
});

export const queryAttachmentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  fileType: z.enum(['X_Ray', 'Prescription', 'Images']).optional(),
});

export const attachmentsValidators = {
  createAttachment: {
    body: createAttachmentSchema,
  },
  queryAttachments: {
    query: queryAttachmentsSchema,
  },
  getAttachment: {
    params: z.object({
      id: z.string().uuid('Invalid attachment ID format'),
    }),
  },
};
