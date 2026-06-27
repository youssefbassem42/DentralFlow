import { Router } from 'express';
import { attachmentsController } from './attachments.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { attachmentsValidators } from './attachments.validator.js';
import { upload } from '../../common/middleware/upload.js';

const router = Router();

/**
 * @openapi
 * /attachments:
 *   get:
 *     summary: Retrieve attachments list
 *     description: Retrieve all uploaded file attachments. Supports filtering by doctorId, fileType, and page. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *       - name: fileType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [X_Ray, Prescription, Images]
 *     responses:
 *       200:
 *         description: Attachments list retrieved successfully
 *   post:
 *     summary: Upload a new file attachment
 *     description: Upload document, prescription, image, or X-Ray file. Accessible by ADMIN and DOCTOR.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - fileType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               fileType:
 *                 type: string
 *                 enum: [X_Ray, Prescription, Images]
 *                 example: "X_Ray"
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for Admin if they don't have a doctor profile. Ignored for Doctors.
 *               notes:
 *                 type: string
 *                 example: Pre-op panoramic X-Ray.
 *     responses:
 *       201:
 *         description: Attachment uploaded successfully
 *       400:
 *         description: Validation error or invalid file type
 *       404:
 *         description: Doctor profile not found
 */
router
  .route('/')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(attachmentsValidators.queryAttachments),
    attachmentsController.getAttachments
  )
  .post(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    upload.single('file'),
    validate(attachmentsValidators.createAttachment),
    attachmentsController.createAttachment
  );

/**
 * @openapi
 * /attachments/{id}:
 *   get:
 *     summary: Retrieve attachment metadata by ID
 *     description: Retrieve metadata of a specific attachment file. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *         description: Attachment metadata retrieved successfully
 *       404:
 *         description: Attachment not found
 *   delete:
 *     summary: Soft-delete an attachment (Admin/Doctor only)
 *     description: Mark file attachment as deleted and remove physical storage file.
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
 *         description: Attachment deleted successfully
 *       404:
 *         description: Attachment not found
 */
router
  .route('/:id')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(attachmentsValidators.getAttachment),
    attachmentsController.getAttachment
  )
  .delete(
    authenticate,
    authorize('ADMIN', 'DOCTOR'),
    validate(attachmentsValidators.getAttachment),
    attachmentsController.deleteAttachment
  );

/**
 * @openapi
 * /attachments/{id}/download:
 *   get:
 *     summary: Download attachment file
 *     description: Serves/downloads the physical attachment file from disk. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *         description: File downloaded successfully
 *       404:
 *         description: Attachment or physical file not found
 */
router
  .route('/:id/download')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(attachmentsValidators.getAttachment),
    attachmentsController.downloadAttachment
  );

export default router;
