import { Router } from 'express';
import { examinationsController } from './examinations.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { examinationsValidators } from './examinations.validator.js';

const router = Router();

/**
 * @openapi
 * /examinations:
 *   get:
 *     summary: Retrieve clinical examinations list
 *     description: Retrieve all recorded examinations. Supports filtering by patientId or doctorId and pagination. Accessible by ADMIN and DOCTOR.
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
 *     responses:
 *       200:
 *         description: Examinations retrieved successfully
 *       403:
 *         description: Forbidden (e.g. Receptionists cannot list exams)
 *   post:
 *     summary: Record a new medical examination
 *     description: Create a clinical examination record. Accessible by ADMIN and DOCTOR.
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
 *               - chiefComplaint
 *               - diagnosis
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *                 example: "a80b97c1-df0a-4c28-98e3-85f02bc923a1"
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for Admin if they don't have a doctor profile. Ignored for Doctors (defaults to self).
 *               chiefComplaint:
 *                 type: string
 *                 example: Severe pain in the lower left molar when drinking cold water
 *               diagnosis:
 *                 type: string
 *                 example: Deep dental caries on tooth #36 with reversible pulpitis
 *               clinicalNotes:
 *                 type: string
 *                 example: Recommended excavation of caries and placing composite restoration
 *               radiologyNotes:
 *                 type: string
 *                 example: Periapical X-ray shows radiolucency on crown of #36, no periapical involvement
 *               prescription:
 *                 type: string
 *                 example: Ibuprofen 400mg every 8 hours as needed for pain
 *               recommendations:
 *                 type: string
 *                 example: Maintain good oral hygiene, brush twice daily
 *               examDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-26T18:50:00.000Z"
 *     responses:
 *       201:
 *         description: Medical examination recorded successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Patient or Doctor not found
 */
router
  .route('/')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(examinationsValidators.queryExaminations),
    examinationsController.getExaminations
  )
  .post(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(examinationsValidators.createExamination),
    examinationsController.createExamination
  );

/**
 * @openapi
 * /examinations/{id}:
 *   get:
 *     summary: Retrieve examination by ID
 *     description: Retrieve specific medical examination record details. Accessible by ADMIN and DOCTOR.
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
 *         description: Examination retrieved successfully
 *       404:
 *         description: Examination not found
 *   patch:
 *     summary: Update medical examination
 *     description: Edit details of an examination. Accessible by ADMIN and DOCTOR.
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
 *               chiefComplaint:
 *                 type: string
 *               diagnosis:
 *                 type: string
 *               clinicalNotes:
 *                 type: string
 *               radiologyNotes:
 *                 type: string
 *               prescription:
 *                 type: string
 *               recommendations:
 *                 type: string
 *     responses:
 *       200:
 *         description: Examination updated successfully
 *       404:
 *         description: Examination not found
 */
router
  .route('/:id')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(examinationsValidators.getExamination),
    examinationsController.getExamination
  )
  .patch(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(examinationsValidators.updateExamination),
    examinationsController.updateExamination
  );

export default router;
