import { Prisma, AttendeeStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

export type EventListQuery = {
  startDate?: string;
  endDate?: string;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  type?: string;
  color?: string;
  allDay?: boolean;
  location?: string;
  attendeeIds?: string[];
};

export type UpdateEventInput = Partial<CreateEventInput>;

export const calendarService = {
  async findAll(query: EventListQuery, userId: string) {
    const where: Prisma.CalendarEventWhereInput = {
      OR: [{ ownerId: userId }, { attendees: { some: { userId } } }],
    };

    if (query.startDate) {
      where.startAt = { gte: new Date(query.startDate) };
    }

    if (query.endDate) {
      where.endAt = { lte: new Date(query.endDate) };
    }

    return prisma.calendarEvent.findMany({
      where,
      orderBy: { startAt: 'asc' },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });
  },

  async findOne(id: string) {
    return prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        reminders: true,
      },
    });
  },

  async create(input: CreateEventInput, ownerId: string) {
    const { attendeeIds, ...eventData } = input;

    return prisma.calendarEvent.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        startAt: new Date(eventData.startAt),
        endAt: new Date(eventData.endAt),
        type: eventData.type || 'meeting',
        color: eventData.color,
        allDay: eventData.allDay || false,
        location: eventData.location,
        ownerId,
        attendees: attendeeIds
          ? {
              create: attendeeIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });
  },

  async update(id: string, input: UpdateEventInput) {
    const { attendeeIds: _attendeeIds, ...eventData } = input;

    const data: Prisma.CalendarEventUpdateInput = {
      title: eventData.title,
      description: eventData.description,
      type: eventData.type,
      color: eventData.color,
      allDay: eventData.allDay,
      location: eventData.location,
    };

    if (eventData.startAt) {
      data.startAt = new Date(eventData.startAt);
    }

    if (eventData.endAt) {
      data.endAt = new Date(eventData.endAt);
    }

    return prisma.calendarEvent.update({
      where: { id },
      data,
    });
  },

  async reschedule(id: string, startAt: string, endAt: string) {
    return prisma.calendarEvent.update({
      where: { id },
      data: {
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      },
    });
  },

  async addAttendee(eventId: string, userId: string) {
    return prisma.eventAttendee.create({
      data: { eventId, userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });
  },

  async removeAttendee(eventId: string, attendeeId: string) {
    // attendeeId here is the composite key or we find by eventId + userId
    return prisma.eventAttendee.delete({
      where: { eventId_userId: { eventId, userId: attendeeId } },
    });
  },

  async updateAttendeeStatus(eventId: string, userId: string, status: AttendeeStatus) {
    return prisma.eventAttendee.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status },
    });
  },

  async remove(id: string) {
    return prisma.calendarEvent.delete({ where: { id } });
  },

  async removeMany(ids: string[]) {
    return prisma.calendarEvent.deleteMany({ where: { id: { in: ids } } });
  },

  async isOwner(id: string, userId: string): Promise<boolean> {
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    return event?.ownerId === userId;
  },
};
