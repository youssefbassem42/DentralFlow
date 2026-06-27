import { Router } from 'express';
import { treatmentsController } from './treatments.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { treatmentsValidators } from './treatments.validator.js';

const router = Router();

/**
 * @openapi
 * /treatments:
 *   get:
 *     summary: Retrieve treatment sessions list
 *     description: Retrieve all recorded treatment sessions. Supports filtering by patientId, doctorId, treatmentPlanId, and pagination. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *       - name: treatmentPlanId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Treatment sessions retrieved successfully
 *   post:
 *     summary: Record a new treatment session
 *     description: Record a dental procedure or treatment session. Accessible by ADMIN and DOCTOR.
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
 *               - treatmentPlanId
 *               - treatmentName
 *               - price
 *               - sessionDate
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 example: "a80b97c1-df0a-4c28-98e3-85f02bc923a1"
 *               treatmentPlanId:
 *                 type: string
 *                 format: uuid
 *                 example: "d20b97c1-df0a-4c28-98e3-85f02bc923e2"
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for Admin if they don't have a doctor profile. Ignored for Doctors.
 *               treatmentName:
 *                 type: string
 *                 example: Composite Filling
 *               toothNumber:
 *                 type: integer
 *                 example: 36
 *               procedure:
 *                 type: string
 *                 example: Restored lower left first molar with composite resin.
 *               price:
 *                 type: number
 *                 example: 120.00
 *               sessionDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-26T18:58:00.000Z"
 *               notes:
 *                 type: string
 *                 example: Checked occlusion, patient reported no discomfort.
 *     responses:
 *       201:
 *         description: Treatment session recorded successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Patient, Doctor, or Treatment Plan not found
 */
router
  .route('/')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(treatmentsValidators.queryTreatments),
    treatmentsController.getTreatments
  )
  .post(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(treatmentsValidators.createTreatment),
    treatmentsController.createTreatment
  );

/**
 * @openapi
 * /treatments/{id}:
 *   get:
 *     summary: Retrieve treatment session by ID
 *     description: Retrieve specific treatment session details. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *         description: Treatment session retrieved successfully
 *       404:
 *         description: Treatment session not found
 *   patch:
 *     summary: Update treatment session details
 *     description: Modify notes, procedure details, pricing or tooth number. Accessible by ADMIN and DOCTOR.
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
 *               treatmentName:
 *                 type: string
 *               toothNumber:
 *                 type: integer
 *               procedure:
 *                 type: string
 *               price:
 *                 type: number
 *               sessionDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Treatment session updated successfully
 *       404:
 *         description: Treatment session not found
 */
router
  .route('/:id')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(treatmentsValidators.getTreatment),
    treatmentsController.getTreatment
  )
  .patch(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(treatmentsValidators.updateTreatment),
    treatmentsController.updateTreatment
  );

export default router;
