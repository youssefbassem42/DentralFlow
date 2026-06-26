import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticate } from '../../common/middleware/auth.js';
import { authorize } from '../../common/middleware/rbac.js';
import { validate } from '../../common/middleware/validate.js';
import { inventoryValidators } from './inventory.validator.js';

const router = Router();

/**
 * @openapi
 * /inventory:
 *   get:
 *     summary: Retrieve inventory items list
 *     description: Retrieve all inventory items with search, page, and low stock filters. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *         description: Search by item name or supplier (fuzzy match)
 *       - name: lowStock
 *         in: query
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter items where quantity <= minimumQuantity
 *     responses:
 *       200:
 *         description: Inventory list retrieved successfully
 *   post:
 *     summary: Add a new inventory item
 *     description: Register a new item in the warehouse inventory. Accessible by ADMIN and RECEPTIONIST.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item
 *               - quantity
 *               - minimumQuantity
 *               - price
 *             properties:
 *               item:
 *                 type: string
 *                 example: Latex Gloves Medium
 *               quantity:
 *                 type: integer
 *                 example: 50
 *               minimumQuantity:
 *                 type: integer
 *                 example: 10
 *               supplier:
 *                 type: string
 *                 example: Dental Supply Corp
 *               price:
 *                 type: number
 *                 example: 15.50
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *       400:
 *         description: Validation error
 */
router
  .route('/')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(inventoryValidators.queryInventory),
    inventoryController.getInventory
  )
  .post(
    authenticate,
    authorize('ADMIN', 'RECEPTIONIST'),
    validate(inventoryValidators.createInventoryItem),
    inventoryController.createInventoryItem
  );

/**
 * @openapi
 * /inventory/{id}:
 *   get:
 *     summary: Get an inventory item by ID
 *     description: Retrieve detailed metadata of an inventory item. Accessible by ADMIN, DOCTOR, and RECEPTIONIST.
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
 *         description: Inventory item retrieved successfully
 *       404:
 *         description: Item not found
 *   patch:
 *     summary: Update inventory item stock details
 *     description: Modify details (e.g. quantity, threshold, price) of an inventory item. Accessible by ADMIN and RECEPTIONIST.
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
 *               item:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               minimumQuantity:
 *                 type: integer
 *               supplier:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *       404:
 *         description: Item not found
 *   delete:
 *     summary: Soft-delete an inventory item (Admin only)
 *     description: Soft-delete the inventory item record.
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
 *         description: Inventory item deleted successfully
 *       404:
 *         description: Item not found
 */
router
  .route('/:id')
  .get(
    authenticate,
    authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'),
    validate(inventoryValidators.getInventoryItem),
    inventoryController.getInventoryItem
  )
  .patch(
    authenticate,
    authorize('ADMIN', 'RECEPTIONIST'),
    validate(inventoryValidators.updateInventoryItem),
    inventoryController.updateInventoryItem
  )
  .delete(
    authenticate,
    authorize('ADMIN'),
    validate(inventoryValidators.getInventoryItem),
    inventoryController.deleteInventoryItem
  );

export default router;
