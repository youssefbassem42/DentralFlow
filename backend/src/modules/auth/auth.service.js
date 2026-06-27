import { authRepository } from './auth.repository.js';
import { comparePassword } from '../../common/utils/hash.js';
import { generateToken } from '../../common/utils/jwt.js';
import { UnauthorizedError } from '../../common/errors/AppError.js';
import { AuthResponseDto } from './auth.dto.js';

export class AuthService {
  async login(email, password) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is deactivated.');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = generateToken({ id: user.id, role: user.role });
    return new AuthResponseDto(user, token);
  }
}

export const authService = new AuthService();
