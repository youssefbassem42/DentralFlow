import { Router } from 'express';
import { patientsController } from './patients.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { patientsValidators } from './patients.validator.js';

const router = Router();

/**
 * @openapi
 * /patients:
 *   get:
 *     summary: Retrieve patient list with search, filter, and pagination
 *     description: Retrieve all active patients in the system. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by name, phone, or email (fuzzy matching)
 *       - name: gender
 *         in: query
 *         schema:
 *           type: string
 *       - name: bloodGroup
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *   post:
 *     summary: Register a new patient
 *     description: Register a patient profile. Accessible by ADMIN and RECEPTIONIST.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - gender
 *               - dateOfBirth
 *               - phone
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Bruce Wayne
 *               gender:
 *                 type: string
 *                 example: Male
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1980-02-19"
 *               phone:
 *                 type: string
 *                 example: "+199999999"
 *               email:
 *                 type: string
 *                 example: bruce@wayne.com
 *               address:
 *                 type: string
 *                 example: Gotham City
 *               bloodGroup:
 *                 type: string
 *                 example: O+
 *               allergies:
 *                 type: string
 *                 example: None
 *               medicalHistory:
 *                 type: string
 *                 example: High blood pressure history
 *               notes:
 *                 type: string
 *                 example: Patient is a VIP
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Phone number already registered
 */
router
  .route('/')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(patientsValidators.queryPatients),
    patientsController.getPatients
  )
  .post(
    authenticate,
    authorize('ADMIN', 'RECEPTIONIST'),
    validate(patientsValidators.createPatient),
    patientsController.registerPatient
  );

/**
 * @openapi
 * /patients/{id}:
 *   get:
 *     summary: Get patient profile by ID
 *     description: Retrieve details of a patient by their ID. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *         description: Patient profile retrieved successfully
 *       404:
 *         description: Patient not found
 *   patch:
 *     summary: Update patient profile
 *     description: Update details of a patient. Accessible by ADMIN and RECEPTIONIST.
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
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               allergies:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient profile updated successfully
 *       404:
 *         description: Patient not found
 *   delete:
 *     summary: Soft delete patient profile (Admin only)
 *     description: Soft delete patient record by marking deletedAt.
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
 *         description: Patient profile deleted successfully
 *       404:
 *         description: Patient not found
 */
router
  .route('/:id')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(patientsValidators.getPatient),
    patientsController.getPatient
  )
  .patch(
    authenticate,
    authorize('ADMIN', 'RECEPTIONIST'),
    validate(patientsValidators.updatePatient),
    patientsController.updatePatient
  )
  .delete(
    authenticate,
    authorize('ADMIN'),
    validate(patientsValidators.getPatient),
    patientsController.deletePatient
  );

export default router;
