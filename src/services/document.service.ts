import { Prisma, SharePermission } from '@prisma/client';
import { prisma } from '../utils/prisma';

export type DocumentListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  folder?: string;
  tags?: string[];
};

export type CreateDocumentInput = {
  title: string;
  content?: string;
  folder?: string;
  type?: string;
  teamId?: string;
};

export type UpdateDocumentInput = Partial<CreateDocumentInput>;

export const documentService = {
  async findAll(query: DocumentListQuery, userId: string) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      OR: [{ ownerId: userId }, { shares: { some: { sharedWithId: userId } } }],
    };

    if (query.search) {
      where.AND = {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    if (query.folder) {
      where.folder = query.folder;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { some: { tag: { name: { in: query.tags } } } };
    }

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, avatar: true },
          },
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { shares: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async findOne(id: string) {
    // Increment views
    await prisma.document.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return prisma.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        team: {
          select: { id: true, name: true },
        },
        tags: {
          include: { tag: true },
        },
        shares: {
          include: {
            sharedWith: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
  },

  async create(input: CreateDocumentInput, ownerId: string) {
    return prisma.document.create({
      data: {
        title: input.title,
        content: input.content || '',
        folder: input.folder,
        type: input.type || 'doc',
        ownerId,
        teamId: input.teamId,
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });
  },

  async update(id: string, input: UpdateDocumentInput) {
    return prisma.document.update({
      where: { id },
      data: input,
    });
  },

  async rename(id: string, title: string) {
    return prisma.document.update({
      where: { id },
      data: { title },
    });
  },

  async move(id: string, folder: string) {
    return prisma.document.update({
      where: { id },
      data: { folder },
    });
  },

  async updateTags(id: string, tagNames: string[]) {
    // Remove existing tags
    await prisma.documentTag.deleteMany({ where: { documentId: id } });

    // Create or find tags and link them
    for (const name of tagNames) {
      const tag = await prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await prisma.documentTag.create({
        data: { documentId: id, tagId: tag.id },
      });
    }

    return this.findOne(id);
  },

  async share(id: string, userId: string, permission: SharePermission = SharePermission.READ) {
    // Find existing share or create new one
    const existing = await prisma.documentShare.findFirst({
      where: { documentId: id, sharedWithId: userId },
    });

    if (existing) {
      return prisma.documentShare.update({
        where: { id: existing.id },
        data: { permission },
      });
    }

    return prisma.documentShare.create({
      data: { documentId: id, sharedWithId: userId, permission },
    });
  },

  async unshare(id: string, userId: string) {
    const share = await prisma.documentShare.findFirst({
      where: { documentId: id, sharedWithId: userId },
    });

    if (share) {
      return prisma.documentShare.delete({
        where: { id: share.id },
      });
    }

    return null;
  },

  async remove(id: string) {
    return prisma.document.delete({ where: { id } });
  },

  async removeMany(ids: string[]) {
    return prisma.document.deleteMany({ where: { id: { in: ids } } });
  },

  async isOwner(id: string, userId: string): Promise<boolean> {
    const doc = await prisma.document.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    return doc?.ownerId === userId;
  },

  async hasAccess(id: string, userId: string): Promise<boolean> {
    const doc = await prisma.document.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { shares: { some: { sharedWithId: userId } } }],
      },
    });
    return !!doc;
  },
};
