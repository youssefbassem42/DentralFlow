import { usersRepository } from './users.repository.js';
import { hashPassword } from '../../common/utils/hash.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../common/errors/AppError.js';
import { UserDto } from './users.dto.js';

export class UsersService {
  async getAllUsers(filters) {
    const users = await usersRepository.findMany(filters);
    return UserDto.array(users);
  }

  async getUserById(id) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return new UserDto(user);
  }

  async createUser(payload) {
    // Check if email already registered
    const existingUser = await usersRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new ConflictError('Email address is already in use.');
    }

    // Hash the password
    const hashedPassword = await hashPassword(payload.password);

    const user = await usersRepository.create({
      ...payload,
      password: hashedPassword,
    });

    return new UserDto(user);
  }

  async updateUser(id, payload) {
    // Check if user exists
    const userExists = await usersRepository.findById(id);
    if (!userExists) {
      throw new NotFoundError('User not found.');
    }

    // Check if email is updated and unique
    if (payload.email && payload.email !== userExists.email) {
      const existingUser = await usersRepository.findByEmail(payload.email);
      if (existingUser) {
        throw new ConflictError('Email address is already in use.');
      }
    }

    // Hash password if updated
    const updatePayload = { ...payload };
    if (payload.password) {
      updatePayload.password = await hashPassword(payload.password);
    }

    const updatedUser = await usersRepository.update(id, updatePayload);
    return new UserDto(updatedUser);
  }

  async deleteUser(id, currentUserId) {
    if (id === currentUserId) {
      throw new BadRequestError('You cannot delete your own account.');
    }

    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (user.email === 'admin@dcms.com') {
      throw new BadRequestError('The system administrator account cannot be deleted.');
    }

    await usersRepository.softDelete(id);
    return { id, message: 'User deleted successfully.' };
  }
}

export const usersService = new UsersService();
