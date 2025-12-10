import { prisma } from '../utils/prisma';

export type CreateMessageInput = {
  conversationId: string;
  content: string;
  type?: string;
};

export type CreateConversationInput = {
  name?: string;
  isGroup?: boolean;
  participantIds: string[];
};

export const messageService = {
  async getConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return conversations.map((conv) => ({
      ...conv,
      lastMessage: conv.messages[0] || null,
      unreadCount:
        conv.participants.find((p) => p.userId === userId)?.unreadCount || 0,
    }));
  },

  async getConversation(id: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!conversation) return null;

    // Mark as read
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });

    return {
      ...conversation,
      messages: conversation.messages.reverse(),
    };
  },

  async createConversation(input: CreateConversationInput, creatorId: string) {
    const allParticipants = [...new Set([creatorId, ...input.participantIds])];

    return prisma.conversation.create({
      data: {
        name: input.name,
        isGroup: input.isGroup || allParticipants.length > 2,
        participants: {
          create: allParticipants.map((userId) => ({
            userId,
            role: userId === creatorId ? 'owner' : 'member',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });
  },

  async sendMessage(input: CreateMessageInput, senderId: string) {
    const message = await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId,
        content: input.content,
        type: input.type || 'text',
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    });

    // Increment unread count for other participants
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: input.conversationId,
        userId: { not: senderId },
      },
      data: { unreadCount: { increment: 1 } },
    });

    return message;
  },

  async markAsRead(conversationId: string, userId: string) {
    return prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });
  },

  async deleteMessage(id: string) {
    return prisma.message.delete({ where: { id } });
  },

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    return !!participant;
  },

  async isMessageOwner(messageId: string, userId: string): Promise<boolean> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    });
    return message?.senderId === userId;
  },
};
