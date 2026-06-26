import { Router } from 'express';
import { appointmentsController } from './appointments.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { appointmentsValidators } from './appointments.validator.js';

const router = Router();

/**
 * @openapi
 * /appointments:
 *   get:
 *     summary: Retrieve appointment list
 *     description: Retrieve all active appointments. Supports filtering by doctorId, patientId, specific date, today's schedule, and pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: doctorId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: patientId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: appointmentDate
 *         in: query
 *         schema:
 *           type: string
 *         description: Format YYYY-MM-DD
 *       - name: today
 *         in: query
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter for today's schedule only
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *   post:
 *     summary: Book a new appointment
 *     description: Create an appointment. Automatically validates doctor schedule conflicts.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorId
 *               - appointmentDate
 *               - appointmentTime
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 example: "a80b97c1-df0a-4c28-98e3-85f02bc923a1"
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-07-01"
 *               appointmentTime:
 *                 type: string
 *                 example: "10:30"
 *               reason:
 *                 type: string
 *                 example: Regular checkup and cleaning
 *               notes:
 *                 type: string
 *                 example: Patient prefers morning sessions
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Doctor scheduling conflict / Double-booking error
 */
router
  .route('/')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(appointmentsValidators.queryAppointments),
    appointmentsController.getAppointments
  )
  .post(
    authenticate,
    authorize('ADMIN', 'RECEPTIONIST'),
    validate(appointmentsValidators.createAppointment),
    appointmentsController.createAppointment
  );

/**
 * @openapi
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     description: Retrieve details of an appointment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Appointment retrieved successfully
 *       404:
 *         description: Appointment not found
 *   patch:
 *     summary: Update appointment
 *     description: Reschedule, change status, or update reason/notes. Checks for schedule conflicts if date/time are modified.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *               appointmentTime:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Scheduled, Completed, Cancelled, NoShow]
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Conflict / Doctor double-booking
 *   delete:
 *     summary: Cancel/Delete appointment
 *     description: Soft delete an appointment and flag status as Cancelled.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       404:
 *         description: Appointment not found
 */
router
  .route('/:id')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(appointmentsValidators.getAppointment),
    appointmentsController.getAppointment
  )
  .patch(
    authenticate,
    authorize('ADMIN', 'RECEPTIONIST'),
    validate(appointmentsValidators.updateAppointment),
    appointmentsController.updateAppointment
  )
  .delete(
    authenticate,
    authorize('ADMIN', 'RECEPTIONIST'),
    validate(appointmentsValidators.getAppointment),
    appointmentsController.deleteAppointment
  );

export default router;
