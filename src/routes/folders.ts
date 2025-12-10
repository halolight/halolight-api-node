import { Router } from 'express';
import { z } from 'zod';
import { folderService } from '../services/folder.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/folders
router.get(
  '/',
  validate(z.object({ parentId: z.string().optional() }), 'query'),
  async (req, res) => {
    try {
      const folders = await folderService.findAll(req.user!.id, req.query.parentId as string);
      res.json(successResponse(folders));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// GET /api/folders/tree
router.get('/tree', async (req, res) => {
  try {
    const tree = await folderService.getTree(req.user!.id);
    res.json(successResponse(tree));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/folders/:id
router.get('/:id', async (req, res) => {
  try {
    const folder = await folderService.findOne(req.params.id);
    if (!folder) {
      return res.status(404).json(errorResponse('Folder not found'));
    }
    res.json(successResponse(folder));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/folders
router.post(
  '/',
  validate(
    z.object({
      name: z.string().min(1),
      parentId: z.string().optional(),
      teamId: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const folder = await folderService.create(req.body, req.user!.id);
      res.status(201).json(successResponse(folder, 'Folder created'));
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json(errorResponse('Folder path already exists'));
      }
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PATCH /api/folders/:id/rename
router.patch(
  '/:id/rename',
  validate(z.object({ name: z.string().min(1) })),
  async (req, res) => {
    try {
      const isOwner = await folderService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can rename'));
      }
      const folder = await folderService.rename(req.params.id, req.body.name);
      res.json(successResponse(folder, 'Folder renamed'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/folders/:id
router.delete('/:id', async (req, res) => {
  try {
    const isOwner = await folderService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only owner can delete'));
    }
    await folderService.remove(req.params.id);
    res.json(successResponse(null, 'Folder deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
