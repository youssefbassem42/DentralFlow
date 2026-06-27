import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { reportsValidators } from './reports.validator.js';

const router = Router();

/**
 * @openapi
 * /reports/dashboard:
 *   get:
 *     summary: Retrieve dashboard aggregate report stats
 *     description: Retrieve clinic-wide analytics for patients, doctors, appointments, revenue, and inventory. Accessible by ADMIN only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard report statistics compiled successfully
 *       403:
 *         description: Access forbidden
 */
router.route('/dashboard').get(authenticate, authorize('ADMIN'), reportsController.getDashboard);

/**
 * @openapi
 * /reports/revenue:
 *   get:
 *     summary: Retrieve revenue aggregates and transactions list
 *     description: Retrieve detailed revenue statistics filtered by date ranges. Accessible by ADMIN only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter starting payment date (ISO format or YYYY-MM-DD)
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter ending payment date (ISO format or YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue report compiled successfully
 *       403:
 *         description: Access forbidden
 */
router
  .route('/revenue')
  .get(
    authenticate,
    authorize('ADMIN'),
    validate(reportsValidators.revenueReport),
    reportsController.getRevenue
  );

/**
 * @openapi
 * /reports/inventory:
 *   get:
 *     summary: Retrieve warehouse inventory details report
 *     description: Retrieve statistics on total stock values, suppliers, catalog items, and low stock list. Accessible by ADMIN only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouse inventory report compiled successfully
 *       403:
 *         description: Access forbidden
 */
router.route('/inventory').get(authenticate, authorize('ADMIN'), reportsController.getInventory);

export default router;
