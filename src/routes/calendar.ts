import { Router } from 'express';
import { z } from 'zod';
import { calendarService } from '../services/calendar.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/calendar/events
router.get(
  '/events',
  validate(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
    'query'
  ),
  async (req, res) => {
    try {
      const events = await calendarService.findAll(req.query as any, req.user!.id);
      res.json(successResponse(events));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// GET /api/calendar/events/:id
router.get('/events/:id', async (req, res) => {
  try {
    const event = await calendarService.findOne(req.params.id);
    if (!event) {
      return res.status(404).json(errorResponse('Event not found'));
    }
    res.json(successResponse(event));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/calendar/events
router.post(
  '/events',
  validate(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      startAt: z.string(),
      endAt: z.string(),
      type: z.string().optional(),
      color: z.string().optional(),
      allDay: z.boolean().optional(),
      location: z.string().optional(),
      attendeeIds: z.array(z.string()).optional(),
    })
  ),
  async (req, res) => {
    try {
      const event = await calendarService.create(req.body, req.user!.id);
      res.status(201).json(successResponse(event, 'Event created'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PUT /api/calendar/events/:id
router.put(
  '/events/:id',
  validate(
    z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      startAt: z.string().optional(),
      endAt: z.string().optional(),
      type: z.string().optional(),
      color: z.string().optional(),
      allDay: z.boolean().optional(),
      location: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const isOwner = await calendarService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can update'));
      }
      const event = await calendarService.update(req.params.id, req.body);
      res.json(successResponse(event, 'Event updated'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PATCH /api/calendar/events/:id/reschedule
router.patch(
  '/events/:id/reschedule',
  validate(z.object({ startAt: z.string(), endAt: z.string() })),
  async (req, res) => {
    try {
      const isOwner = await calendarService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can reschedule'));
      }
      const event = await calendarService.reschedule(req.params.id, req.body.startAt, req.body.endAt);
      res.json(successResponse(event, 'Event rescheduled'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/calendar/events/:id/attendees
router.post(
  '/events/:id/attendees',
  validate(z.object({ userId: z.string() })),
  async (req, res) => {
    try {
      const isOwner = await calendarService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can add attendees'));
      }
      const attendee = await calendarService.addAttendee(req.params.id, req.body.userId);
      res.status(201).json(successResponse(attendee, 'Attendee added'));
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json(errorResponse('User is already an attendee'));
      }
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/calendar/events/:id/attendees/:attendeeId
router.delete('/events/:id/attendees/:attendeeId', async (req, res) => {
  try {
    const isOwner = await calendarService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only owner can remove attendees'));
    }
    await calendarService.removeAttendee(req.params.id, req.params.attendeeId);
    res.json(successResponse(null, 'Attendee removed'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/calendar/events/batch-delete
router.post(
  '/events/batch-delete',
  validate(z.object({ ids: z.array(z.string()) })),
  async (req, res) => {
    try {
      await calendarService.removeMany(req.body.ids);
      res.json(successResponse(null, 'Events deleted'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/calendar/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    const isOwner = await calendarService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only owner can delete'));
    }
    await calendarService.remove(req.params.id);
    res.json(successResponse(null, 'Event deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
