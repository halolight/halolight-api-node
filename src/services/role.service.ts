import { prisma } from '../utils/prisma';

export type CreateRoleInput = {
  name: string;
  label: string;
  description?: string;
};

export type UpdateRoleInput = Partial<CreateRoleInput>;

export const roleService = {
  async findAll() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findOne(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  },

  async create(input: CreateRoleInput) {
    return prisma.role.create({
      data: input,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  async update(id: string, input: UpdateRoleInput) {
    return prisma.role.update({
      where: { id },
      data: input,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  async remove(id: string) {
    return prisma.role.delete({ where: { id } });
  },

  async assignPermissions(roleId: string, permissionIds: string[]) {
    // Remove existing permissions
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    // Add new permissions
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }

    return this.findOne(roleId);
  },
};
