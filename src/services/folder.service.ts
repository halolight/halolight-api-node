import { prisma } from '../utils/prisma';

export type CreateFolderInput = {
  name: string;
  parentId?: string;
  teamId?: string;
};

export const folderService = {
  async findAll(userId: string, parentId?: string) {
    return prisma.folder.findMany({
      where: {
        ownerId: userId,
        parentId: parentId || null,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { children: true, files: true },
        },
      },
    });
  },

  async findOne(id: string) {
    return prisma.folder.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, path: true },
        },
        children: {
          select: { id: true, name: true, path: true },
        },
        files: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
      },
    });
  },

  async getTree(userId: string) {
    const folders = await prisma.folder.findMany({
      where: { ownerId: userId },
      orderBy: { path: 'asc' },
      select: {
        id: true,
        name: true,
        path: true,
        parentId: true,
      },
    });

    // Build tree structure
    const buildTree = (parentId: string | null): any[] => {
      return folders
        .filter((f) => f.parentId === parentId)
        .map((f) => ({
          ...f,
          children: buildTree(f.id),
        }));
    };

    return buildTree(null);
  },

  async create(input: CreateFolderInput, ownerId: string) {
    let path = `/${input.name}`;

    if (input.parentId) {
      const parent = await prisma.folder.findUnique({
        where: { id: input.parentId },
      });
      if (parent) {
        path = `${parent.path}/${input.name}`;
      }
    }

    return prisma.folder.create({
      data: {
        name: input.name,
        path,
        parentId: input.parentId,
        teamId: input.teamId,
        ownerId,
      },
    });
  },

  async rename(id: string, name: string) {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) return null;

    const pathParts = folder.path.split('/');
    pathParts[pathParts.length - 1] = name;
    const newPath = pathParts.join('/');

    return prisma.folder.update({
      where: { id },
      data: { name, path: newPath },
    });
  },

  async remove(id: string) {
    // This will cascade delete children and files due to schema relations
    return prisma.folder.delete({ where: { id } });
  },

  async isOwner(id: string, userId: string): Promise<boolean> {
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    return folder?.ownerId === userId;
  },
};
