import { Router } from 'express';
import { treatmentPlansController } from './plans.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { plansValidators } from './plans.validator.js';

const router = Router();

/**
 * @openapi
 * /treatment-plans:
 *   get:
 *     summary: Retrieve treatment plans list
 *     description: Retrieve all recorded treatment plans. Supports filtering by patientId, doctorId, status, and pagination. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [Pending, Active, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Treatment plans retrieved successfully
 *   post:
 *     summary: Create a new treatment plan
 *     description: Propose a patient treatment plan. Accessible by ADMIN and DOCTOR.
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
 *               - title
 *               - estimatedCost
 *               - estimatedSessions
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 example: "a80b97c1-df0a-4c28-98e3-85f02bc923a1"
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for Admin if they don't have a doctor profile. Ignored for Doctors.
 *               title:
 *                 type: string
 *                 example: Full Mouth Rehabilitation
 *               description:
 *                 type: string
 *                 example: Includes scaling, composite fillings, and two dental crowns on molars.
 *               estimatedCost:
 *                 type: number
 *                 example: 1200.00
 *               estimatedSessions:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       201:
 *         description: Treatment plan created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Patient or Doctor not found
 */
router
  .route('/')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(plansValidators.queryPlans),
    treatmentPlansController.getTreatmentPlans
  )
  .post(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(plansValidators.createPlan),
    treatmentPlansController.createTreatmentPlan
  );

/**
 * @openapi
 * /treatment-plans/{id}:
 *   get:
 *     summary: Retrieve treatment plan by ID
 *     description: Retrieve specific treatment plan record details. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *         description: Treatment plan retrieved successfully
 *       404:
 *         description: Treatment plan not found
 *   patch:
 *     summary: Update treatment plan
 *     description: Modify details or update plan status. Accessible by ADMIN and DOCTOR.
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               estimatedSessions:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [Pending, Active, Completed, Cancelled]
 *     responses:
 *       200:
 *         description: Treatment plan updated successfully
 *       404:
 *         description: Treatment plan not found
 */
router
  .route('/:id')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(plansValidators.getPlan),
    treatmentPlansController.getTreatmentPlan
  )
  .patch(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(plansValidators.updatePlan),
    treatmentPlansController.updateTreatmentPlan
  );

export default router;
