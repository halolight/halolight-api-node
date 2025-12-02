import { User, Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/hash';

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
  role?: Role;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: Role;
  status?: string;
  avatar?: string;
}

export interface ListUsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class UserService {
  async list(query: ListUsersQuery): Promise<PaginatedResponse<Omit<User, 'password'>>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async create(data: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, password, name, role } = data;

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || Role.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async update(id: string, data: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}

export const userService = new UserService();
