import { Router } from 'express';
import prisma from '../common/database/prisma.js';
import authRouter from '../modules/auth/auth.routes.js';
import usersRouter from '../modules/users/users.routes.js';
import patientsRouter from '../modules/patients/patients.routes.js';
import appointmentsRouter from '../modules/appointments/appointments.routes.js';
import examinationsRouter from '../modules/examinations/examinations.routes.js';
import treatmentPlansRouter from '../modules/treatment-plans/plans.routes.js';
import treatmentsRouter from '../modules/treatments/treatments.routes.js';
import paymentsRouter from '../modules/payments/payments.routes.js';
import attachmentsRouter from '../modules/attachments/attachments.routes.js';
import inventoryRouter from '../modules/inventory/inventory.routes.js';
import reportsRouter from '../modules/reports/reports.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/patients', patientsRouter);
router.use('/appointments', appointmentsRouter);
router.use('/examinations', examinationsRouter);
router.use('/treatment-plans', treatmentPlansRouter);
router.use('/treatments', treatmentsRouter);
router.use('/payments', paymentsRouter);
router.use('/attachments', attachmentsRouter);
router.use('/inventory', inventoryRouter);
router.use('/reports', reportsRouter);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Retrieve status of the application and database connectivity.
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 errors:
 *                   type: array
 */
router.get('/health', async (req, res, next) => {
  try {
    // Ping database
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: 'System is healthy',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
      errors: [],
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
