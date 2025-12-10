import { Router } from 'express';
import { z } from 'zod';
import { SharePermission } from '@prisma/client';
import { documentService } from '../services/document.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/documents
router.get(
  '/',
  validate(
    z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
      search: z.string().optional(),
      folder: z.string().optional(),
      tags: z.string().optional(),
    }),
    'query'
  ),
  async (req, res) => {
    try {
      const query = {
        ...req.query,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      };
      const result = await documentService.findAll(query as any, req.user!.id);
      res.json(successResponse(result.data, undefined, result.meta));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const hasAccess = await documentService.hasAccess(req.params.id, req.user!.id);
    if (!hasAccess) {
      return res.status(403).json(errorResponse('Access denied'));
    }
    const doc = await documentService.findOne(req.params.id);
    if (!doc) {
      return res.status(404).json(errorResponse('Document not found'));
    }
    res.json(successResponse(doc));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/documents
router.post(
  '/',
  validate(
    z.object({
      title: z.string().min(1),
      content: z.string().optional(),
      folder: z.string().optional(),
      type: z.string().optional(),
      teamId: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const doc = await documentService.create(req.body, req.user!.id);
      res.status(201).json(successResponse(doc, 'Document created'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PUT /api/documents/:id
router.put(
  '/:id',
  validate(
    z.object({
      title: z.string().min(1).optional(),
      content: z.string().optional(),
      folder: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const isOwner = await documentService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can update'));
      }
      const doc = await documentService.update(req.params.id, req.body);
      res.json(successResponse(doc, 'Document updated'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PATCH /api/documents/:id/rename
router.patch(
  '/:id/rename',
  validate(z.object({ title: z.string().min(1) })),
  async (req, res) => {
    try {
      const isOwner = await documentService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can rename'));
      }
      const doc = await documentService.rename(req.params.id, req.body.title);
      res.json(successResponse(doc, 'Document renamed'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/documents/:id/move
router.post(
  '/:id/move',
  validate(z.object({ folder: z.string() })),
  async (req, res) => {
    try {
      const isOwner = await documentService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can move'));
      }
      const doc = await documentService.move(req.params.id, req.body.folder);
      res.json(successResponse(doc, 'Document moved'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/documents/:id/tags
router.post(
  '/:id/tags',
  validate(z.object({ tags: z.array(z.string()) })),
  async (req, res) => {
    try {
      const isOwner = await documentService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can update tags'));
      }
      const doc = await documentService.updateTags(req.params.id, req.body.tags);
      res.json(successResponse(doc, 'Tags updated'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/documents/:id/share
router.post(
  '/:id/share',
  validate(
    z.object({
      userId: z.string(),
      permission: z.nativeEnum(SharePermission).optional(),
    })
  ),
  async (req, res) => {
    try {
      const isOwner = await documentService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can share'));
      }
      const share = await documentService.share(req.params.id, req.body.userId, req.body.permission);
      res.json(successResponse(share, 'Document shared'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/documents/:id/unshare
router.post(
  '/:id/unshare',
  validate(z.object({ userId: z.string() })),
  async (req, res) => {
    try {
      const isOwner = await documentService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can unshare'));
      }
      await documentService.unshare(req.params.id, req.body.userId);
      res.json(successResponse(null, 'Share removed'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/documents/batch-delete
router.post(
  '/batch-delete',
  validate(z.object({ ids: z.array(z.string()) })),
  async (req, res) => {
    try {
      await documentService.removeMany(req.body.ids);
      res.json(successResponse(null, 'Documents deleted'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const isOwner = await documentService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only owner can delete'));
    }
    await documentService.remove(req.params.id);
    res.json(successResponse(null, 'Document deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
