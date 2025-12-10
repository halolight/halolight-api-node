import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export type NotificationListQuery = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
};

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  payload?: any;
};

export const notificationService = {
  async findAll(query: NotificationListQuery, userId: string) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };

    if (query.unreadOnly) {
      where.read = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      unreadCount,
    };
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  },

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  },

  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        link: input.link,
        payload: input.payload,
      },
    });
  },

  async remove(id: string) {
    return prisma.notification.delete({ where: { id } });
  },

  async isOwner(id: string, userId: string): Promise<boolean> {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });
    return notification?.userId === userId;
  },
};
