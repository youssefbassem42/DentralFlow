import { z } from 'zod';

export const createPaymentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  doctorId: z.string().uuid('Invalid doctor ID format'),
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['Cash', 'Visa', 'Insurance', 'Wallet']),
  invoiceNumber: z.string().min(1, 'Invoice number cannot be empty').optional(),
  notes: z.string().optional().nullable(),
  paymentDate: z.coerce.date().optional(),
});

export const queryPaymentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  patientId: z.string().uuid('Invalid patient ID format').optional(),
  doctorId: z.string().uuid('Invalid doctor ID format').optional(),
  paymentMethod: z.enum(['Cash', 'Visa', 'Insurance', 'Wallet']).optional(),
});

export const paymentsValidators = {
  createPayment: {
    body: createPaymentSchema,
  },
  queryPayments: {
    query: queryPaymentsSchema,
  },
  getPatientFinancial: {
    params: z.object({
      id: z.string().uuid('Invalid patient ID format'),
    }),
  },
};
