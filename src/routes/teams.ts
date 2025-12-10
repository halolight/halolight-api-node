import { Router } from 'express';
import { z } from 'zod';
import { teamService } from '../services/team.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/teams
router.get(
  '/',
  validate(
    z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
      search: z.string().optional(),
    }),
    'query'
  ),
  async (req, res) => {
    try {
      const result = await teamService.findAll(req.query as any, req.user!.id);
      res.json(successResponse(result.data, undefined, result.meta));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  try {
    const team = await teamService.findOne(req.params.id);
    if (!team) {
      return res.status(404).json(errorResponse('Team not found'));
    }
    res.json(successResponse(team));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/teams
router.post(
  '/',
  validate(
    z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      avatar: z.string().url().optional(),
    })
  ),
  async (req, res) => {
    try {
      const team = await teamService.create(req.body, req.user!.id);
      res.status(201).json(successResponse(team, 'Team created'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PATCH /api/teams/:id
router.patch(
  '/:id',
  validate(
    z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      avatar: z.string().url().optional(),
    })
  ),
  async (req, res) => {
    try {
      const isOwner = await teamService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only team owner can update'));
      }
      const team = await teamService.update(req.params.id, req.body);
      res.json(successResponse(team, 'Team updated'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/teams/:id
router.delete('/:id', async (req, res) => {
  try {
    const isOwner = await teamService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only team owner can delete'));
    }
    await teamService.remove(req.params.id);
    res.json(successResponse(null, 'Team deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/teams/:id/members
router.post(
  '/:id/members',
  validate(z.object({ userId: z.string(), roleId: z.string().optional() })),
  async (req, res) => {
    try {
      const isOwner = await teamService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only team owner can add members'));
      }
      const member = await teamService.addMember(req.params.id, req.body.userId, req.body.roleId);
      res.status(201).json(successResponse(member, 'Member added'));
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json(errorResponse('User is already a member'));
      }
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/teams/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const isOwner = await teamService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only team owner can remove members'));
    }
    await teamService.removeMember(req.params.id, req.params.userId);
    res.json(successResponse(null, 'Member removed'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
