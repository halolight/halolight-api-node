import { prisma } from '../utils/prisma';

export type CreatePermissionInput = {
  action: string;
  resource: string;
  description?: string;
};

export const permissionService = {
  async findAll() {
    return prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  },

  async findOne(id: string) {
    return prisma.permission.findUnique({ where: { id } });
  },

  async create(input: CreatePermissionInput) {
    return prisma.permission.create({ data: input });
  },

  async remove(id: string) {
    return prisma.permission.delete({ where: { id } });
  },
};
