import { inventoryService } from './inventory.service.js';

export class InventoryController {
  getInventory = async (req, res, next) => {
    try {
      const data = await inventoryService.getInventory(req.query);
      return res.status(200).json({
        success: true,
        message: 'Inventory items retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getInventoryItem = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await inventoryService.getInventoryItemById(id);
      return res.status(200).json({
        success: true,
        message: 'Inventory item retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  createInventoryItem = async (req, res, next) => {
    try {
      const creatorId = req.user.id;
      const data = await inventoryService.createInventoryItem(req.body, creatorId);
      return res.status(201).json({
        success: true,
        message: 'Inventory item created successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  updateInventoryItem = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await inventoryService.updateInventoryItem(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Inventory item updated successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  deleteInventoryItem = async (req, res, next) => {
    try {
      const { id } = req.params;
      await inventoryService.deleteInventoryItem(id);
      return res.status(200).json({
        success: true,
        message: 'Inventory item deleted successfully.',
        data: null,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const inventoryController = new InventoryController();
