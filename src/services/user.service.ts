import { Prisma, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';

export type UserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  role?: string;
};

export type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  username?: string;
  phone?: string;
  status?: UserStatus;
  department?: string;
  position?: string;
  bio?: string;
};

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>> & {
  password?: string;
};

export const userService = {
  async findAll(query: UserListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Search filter
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Role filter
    if (query.role) {
      where.roles = { some: { role: { name: query.role } } };
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          status: true,
          department: true,
          position: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findOne(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        department: true,
        position: true,
        bio: true,
        phone: true,
        quotaUsed: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                label: true,
                description: true,
              },
            },
          },
        },
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(input: CreateUserInput) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    return prisma.user.create({
      data: {
        email: input.email,
        username: input.username ?? input.email,
        phone: input.phone,
        password: passwordHash,
        name: input.name,
        status: input.status ?? UserStatus.ACTIVE,
        department: input.department,
        position: input.position,
        bio: input.bio,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });
  },

  async update(id: string, input: UpdateUserInput) {
    const data: Prisma.UserUpdateInput = {
      email: input.email,
      username: input.username,
      phone: input.phone,
      name: input.name,
      status: input.status,
      department: input.department,
      position: input.position,
      bio: input.bio,
    };

    if (input.password) {
      data.password = await bcrypt.hash(input.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });
  },

  async updateStatus(id: string, status: UserStatus) {
    return prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });
  },

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },

  async remove(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  async removeMany(ids: string[]) {
    return prisma.user.deleteMany({ where: { id: { in: ids } } });
  },
};
