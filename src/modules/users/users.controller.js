import { usersService } from './users.service.js';

export class UsersController {
  getUsers = async (req, res, next) => {
    try {
      const data = await usersService.getAllUsers(req.query);
      return res.status(200).json({
        success: true,
        message: 'Users retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  getUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await usersService.getUserById(id);
      return res.status(200).json({
        success: true,
        message: 'User retrieved successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  createUser = async (req, res, next) => {
    try {
      const data = await usersService.createUser(req.body);
      return res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  updateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await usersService.updateUser(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;
      const result = await usersService.deleteUser(id, currentUserId);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: { id: result.id },
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const usersController = new UsersController();
