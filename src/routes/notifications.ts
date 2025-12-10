import { Router } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notification.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/notifications
router.get(
  '/',
  validate(
    z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      unreadOnly: z.coerce.boolean().optional(),
    }),
    'query'
  ),
  async (req, res) => {
    try {
      const result = await notificationService.findAll(req.query as any, req.user!.id);
      res.json(successResponse(result.data, undefined, { ...result.meta, unreadCount: result.unreadCount }));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json(successResponse({ count }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const isOwner = await notificationService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Access denied'));
    }
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(successResponse(notification, 'Marked as read'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json(successResponse(null, 'All marked as read'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const isOwner = await notificationService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Access denied'));
    }
    await notificationService.remove(req.params.id);
    res.json(successResponse(null, 'Notification deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
