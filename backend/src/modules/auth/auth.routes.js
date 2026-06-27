import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../common/middleware/validate.js';
import { authValidators } from './auth.validator.js';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in to the system
 *     description: Authenticate a user with email and password to retrieve a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@dcms.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: AdminPass123!
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         status:
 *                           type: string
 *                 errors:
 *                   type: array
 *       400:
 *         description: Validation error or invalid request format
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(authValidators.login), authController.login);

export default router;
