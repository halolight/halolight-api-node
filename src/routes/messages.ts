import { Router } from 'express';
import { z } from 'zod';
import { messageService } from '../services/message.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/messages/conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await messageService.getConversations(req.user!.id);
    res.json(successResponse(conversations));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/messages/conversations/:id
router.get('/conversations/:id', async (req, res) => {
  try {
    const isParticipant = await messageService.isParticipant(req.params.id, req.user!.id);
    if (!isParticipant) {
      return res.status(403).json(errorResponse('Access denied'));
    }
    const conversation = await messageService.getConversation(req.params.id, req.user!.id);
    if (!conversation) {
      return res.status(404).json(errorResponse('Conversation not found'));
    }
    res.json(successResponse(conversation));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/messages/conversations
router.post(
  '/conversations',
  validate(
    z.object({
      name: z.string().optional(),
      isGroup: z.boolean().optional(),
      participantIds: z.array(z.string()).min(1),
    })
  ),
  async (req, res) => {
    try {
      const conversation = await messageService.createConversation(req.body, req.user!.id);
      res.status(201).json(successResponse(conversation, 'Conversation created'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/messages
router.post(
  '/',
  validate(
    z.object({
      conversationId: z.string(),
      content: z.string().min(1),
      type: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const isParticipant = await messageService.isParticipant(req.body.conversationId, req.user!.id);
      if (!isParticipant) {
        return res.status(403).json(errorResponse('Access denied'));
      }
      const message = await messageService.sendMessage(req.body, req.user!.id);
      res.status(201).json(successResponse(message, 'Message sent'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PUT /api/messages/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    // Mark conversation as read
    await messageService.markAsRead(req.params.id, req.user!.id);
    res.json(successResponse(null, 'Marked as read'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// DELETE /api/messages/:id
router.delete('/:id', async (req, res) => {
  try {
    const isOwner = await messageService.isMessageOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only sender can delete'));
    }
    await messageService.deleteMessage(req.params.id);
    res.json(successResponse(null, 'Message deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
