import { z } from 'zod';

export const revenueReportSchema = z.object({
  startDate: z.string().datetime().optional().or(z.string().date().optional()),
  endDate: z.string().datetime().optional().or(z.string().date().optional()),
});

export const reportsValidators = {
  revenueReport: {
    query: revenueReportSchema,
  },
};
