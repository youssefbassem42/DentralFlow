import { Router } from 'express';
import { usersController } from './users.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { usersValidators } from './users.validator.js';
import { ForbiddenError } from '../../common/errors/AppError.js';

const router = Router();

// Middleware to allow access only to Admin or the user themselves
const selfOrAdmin = (req, res, next) => {
  if (req.user.role === 'ADMIN' || req.user.id === req.params.id) {
    return next();
  }
  return next(new ForbiddenError('You do not have permission to access this resource.'));
};

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Retrieve all active users (Admin only)
 *     description: Retrieve a list of all active users in the system, including nested specialization/license details for Doctors and shifts for Receptionists.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Non-Admin users)
 *   post:
 *     summary: Create a new user (Admin only)
 *     description: Registers a new user. If the user's role is DOCTOR or RECEPTIONIST, it creates the corresponding specialization or shift record in a transaction.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dr. John Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.smith@dcms.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DOCTOR, RECEPTIONIST]
 *                 example: DOCTOR
 *               specialization:
 *                 type: string
 *                 example: Orthodontics
 *               licenseNumber:
 *                 type: string
 *                 example: LIC-100293
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router
  .route('/')
  .get(
    authenticate,
    (req, res, next) => {
      if (req.user.role === 'ADMIN') {
        return next();
      }
      if (
        (req.user.role === 'DOCTOR' || req.user.role === 'RECEPTIONIST') &&
        req.query.role === 'DOCTOR'
      ) {
        return next();
      }
      return next(new ForbiddenError('You do not have permission to access this resource.'));
    },
    usersController.getUsers
  )
  .post(
    authenticate,
    authorize('ADMIN'),
    validate(usersValidators.createUser),
    usersController.createUser
  );

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Retrieve user profile (Self or Admin)
 *     description: Retrieve details of a user by their ID.
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
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update user profile (Self or Admin)
 *     description: Update details of a user. Admin can update any field. Non-admin can only update their own details.
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *               specialization:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               shift:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation or parameter error
 *   delete:
 *     summary: Soft delete a user (Admin only)
 *     description: Marks a user and their role-specific details as deleted.
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
 *         description: User deleted successfully
 *       400:
 *         description: Cannot self-delete
 *       404:
 *         description: User not found
 */
router
  .route('/:id')
  .get(authenticate, selfOrAdmin, validate(usersValidators.getUser), usersController.getUser)
  .patch(
    authenticate,
    selfOrAdmin,
    validate(usersValidators.updateUser),
    usersController.updateUser
  )
  .delete(
    authenticate,
    authorize('ADMIN'),
    validate(usersValidators.getUser),
    usersController.deleteUser
  );

export default router;
