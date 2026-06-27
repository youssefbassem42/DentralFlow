import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { paymentsValidators } from './payments.validator.js';

const router = Router();

/**
 * @openapi
 * /payments:
 *   get:
 *     summary: Retrieve payments list and revenue summary
 *     description: Retrieve recorded payment transactions and the aggregated revenue calculations. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *       - name: patientId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: doctorId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: paymentMethod
 *         in: query
 *         schema:
 *           type: string
 *           enum: [Cash, Visa, Insurance, Wallet]
 *     responses:
 *       200:
 *         description: Payments and summary retrieved successfully
 *   post:
 *     summary: Record a new payment
 *     description: Create a payment transaction for an invoice. Accessible by ADMIN and RECEPTIONIST.
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
 *               - amount
 *               - paymentMethod
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 example: "a80b97c1-df0a-4c28-98e3-85f02bc923a1"
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 example: "b10b97c1-df0a-4c28-98e3-85f02bc923b2"
 *               amount:
 *                 type: number
 *                 example: 150.00
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Visa, Insurance, Wallet]
 *                 example: "Visa"
 *               invoiceNumber:
 *                 type: string
 *                 example: "INV-2026-9999"
 *               notes:
 *                 type: string
 *                 example: Copay portion paid by Visa.
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *       400:
 *         description: Validation error or duplicate invoice number
 *       404:
 *         description: Patient or Doctor not found
 */
router
  .route('/')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(paymentsValidators.queryPayments),
    paymentsController.getPayments
  )
  .post(
    authenticate,
    authorize('ADMIN', 'RECEPTIONIST'),
    validate(paymentsValidators.createPayment),
    paymentsController.createPayment
  );

export default router;
