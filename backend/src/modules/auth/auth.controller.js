import { authService } from './auth.service.js';

export class AuthController {
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data,
        errors: [],
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const authController = new AuthController();
