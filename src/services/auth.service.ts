import { User, Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export class AuthService {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const { email, password, name } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('User with this email already exists') as any;
      error.statusCode = 409;
      error.code = 'USER_EXISTS';
      throw error;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.USER,
      },
    });

    // Generate token
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error('Invalid credentials') as any;
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      const error = new Error('Invalid credentials') as any;
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Generate token
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  }
}

export const authService = new AuthService();
