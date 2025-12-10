import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export type TeamListQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type CreateTeamInput = {
  name: string;
  description?: string;
  avatar?: string;
};

export type UpdateTeamInput = Partial<CreateTeamInput>;

export const teamService = {
  async findAll(query: TeamListQuery, userId: string) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TeamWhereInput = {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    };

    if (query.search) {
      where.AND = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.team.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { members: true },
          },
        },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async findOne(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            role: {
              select: { id: true, name: true, label: true },
            },
          },
        },
      },
    });
  },

  async create(input: CreateTeamInput, ownerId: string) {
    return prisma.team.create({
      data: {
        ...input,
        ownerId,
        members: {
          create: { userId: ownerId },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  },

  async update(id: string, input: UpdateTeamInput) {
    return prisma.team.update({
      where: { id },
      data: input,
    });
  },

  async remove(id: string) {
    return prisma.team.delete({ where: { id } });
  },

  async addMember(teamId: string, userId: string, roleId?: string) {
    return prisma.teamMember.create({
      data: { teamId, userId, roleId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  },

  async removeMember(teamId: string, userId: string) {
    return prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  },

  async isOwner(teamId: string, userId: string): Promise<boolean> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });
    return team?.ownerId === userId;
  },

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    return !!member;
  },
};
