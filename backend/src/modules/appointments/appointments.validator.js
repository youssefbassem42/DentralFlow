import { z } from 'zod';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  doctorId: z.string().uuid('Invalid doctor ID format'),
  appointmentDate: z.coerce.date({ invalid_type_error: 'Invalid appointment date format' }),
  appointmentTime: z.string().regex(timeRegex, 'Time must be in HH:MM format (24-hour clock)'),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format').optional(),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  appointmentDate: z.coerce
    .date({ invalid_type_error: 'Invalid appointment date format' })
    .optional(),
  appointmentTime: z
    .string()
    .regex(timeRegex, 'Time must be in HH:MM format (24-hour clock)')
    .optional(),
  status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'NoShow']).optional(),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const queryAppointmentSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  patientId: z.string().uuid('Invalid patient ID format').optional(),
  appointmentDate: z.string().optional(), // YYYY-MM-DD
  today: z.enum(['true', 'false']).optional().or(z.boolean().optional()),
});

export const appointmentsValidators = {
  createAppointment: {
    body: createAppointmentSchema,
  },
  updateAppointment: {
    body: updateAppointmentSchema,
    params: z.object({
      id: z.string().uuid('Invalid appointment ID format'),
    }),
  },
  getAppointment: {
    params: z.object({
      id: z.string().uuid('Invalid appointment ID format'),
    }),
  },
  queryAppointments: {
    query: queryAppointmentSchema,
  },
};
