import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export type FileListQuery = {
  page?: number;
  limit?: number;
  path?: string;
  type?: string;
  search?: string;
  folderId?: string;
};

export type CreateFileInput = {
  name: string;
  path: string;
  mimeType: string;
  size: number;
  thumbnail?: string;
  folderId?: string;
  teamId?: string;
};

export const fileService = {
  async findAll(query: FileListQuery, userId: string) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.FileWhereInput = { ownerId: userId };

    if (query.folderId) {
      where.folderId = query.folderId;
    }

    if (query.path) {
      where.path = { startsWith: query.path };
    }

    if (query.type) {
      where.mimeType = { startsWith: query.type };
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: {
            select: { id: true, name: true, path: true },
          },
        },
      }),
      prisma.file.count({ where }),
    ]);

    return {
      data: items.map((f) => ({ ...f, size: Number(f.size) })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async findOne(id: string) {
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
        folder: {
          select: { id: true, name: true, path: true },
        },
      },
    });
    return file ? { ...file, size: Number(file.size) } : null;
  },

  async create(input: CreateFileInput, ownerId: string) {
    const file = await prisma.file.create({
      data: {
        name: input.name,
        path: input.path,
        mimeType: input.mimeType,
        size: BigInt(input.size),
        thumbnail: input.thumbnail,
        folderId: input.folderId,
        teamId: input.teamId,
        ownerId,
      },
    });

    // Update user quota
    await prisma.user.update({
      where: { id: ownerId },
      data: { quotaUsed: { increment: BigInt(input.size) } },
    });

    return { ...file, size: Number(file.size) };
  },

  async rename(id: string, name: string) {
    return prisma.file.update({
      where: { id },
      data: { name },
    });
  },

  async move(id: string, folderId: string | null, newPath: string) {
    return prisma.file.update({
      where: { id },
      data: { folderId, path: newPath },
    });
  },

  async copy(id: string, ownerId: string) {
    const original = await prisma.file.findUnique({ where: { id } });
    if (!original) return null;

    const copy = await prisma.file.create({
      data: {
        name: `${original.name} (copy)`,
        path: original.path,
        mimeType: original.mimeType,
        size: original.size,
        thumbnail: original.thumbnail,
        folderId: original.folderId,
        teamId: original.teamId,
        ownerId,
      },
    });

    return { ...copy, size: Number(copy.size) };
  },

  async toggleFavorite(id: string) {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return null;

    return prisma.file.update({
      where: { id },
      data: { isFavorite: !file.isFavorite },
    });
  },

  async remove(id: string) {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return null;

    // Update user quota
    await prisma.user.update({
      where: { id: file.ownerId },
      data: { quotaUsed: { decrement: file.size } },
    });

    return prisma.file.delete({ where: { id } });
  },

  async removeMany(ids: string[], userId: string) {
    const files = await prisma.file.findMany({
      where: { id: { in: ids }, ownerId: userId },
    });

    const totalSize = files.reduce((sum, f) => sum + f.size, BigInt(0));

    await prisma.user.update({
      where: { id: userId },
      data: { quotaUsed: { decrement: totalSize } },
    });

    return prisma.file.deleteMany({ where: { id: { in: ids } } });
  },

  async getStorageInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { quotaUsed: true },
    });

    const totalQuota = 10 * 1024 * 1024 * 1024; // 10GB default
    const used = Number(user?.quotaUsed || 0);

    return {
      used,
      total: totalQuota,
      available: totalQuota - used,
      usedPercent: Math.round((used / totalQuota) * 100),
    };
  },

  async getDownloadUrl(id: string): Promise<string | null> {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return null;
    // In production, generate signed URL from storage service
    return `/api/files/${id}/download`;
  },

  async isOwner(id: string, userId: string): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    return file?.ownerId === userId;
  },
};
