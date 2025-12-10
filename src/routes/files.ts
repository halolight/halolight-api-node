import { Router } from 'express';
import { z } from 'zod';
import { fileService } from '../services/file.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/files
router.get(
  '/',
  validate(
    z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      path: z.string().optional(),
      type: z.string().optional(),
      search: z.string().optional(),
      folderId: z.string().optional(),
    }),
    'query'
  ),
  async (req, res) => {
    try {
      const result = await fileService.findAll(req.query as any, req.user!.id);
      res.json(successResponse(result.data, undefined, result.meta));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// GET /api/files/storage
router.get('/storage', async (req, res) => {
  try {
    const info = await fileService.getStorageInfo(req.user!.id);
    res.json(successResponse(info));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/files/storage-info (alias)
router.get('/storage-info', async (req, res) => {
  try {
    const info = await fileService.getStorageInfo(req.user!.id);
    res.json(successResponse(info));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/files/:id
router.get('/:id', async (req, res) => {
  try {
    const file = await fileService.findOne(req.params.id);
    if (!file) {
      return res.status(404).json(errorResponse('File not found'));
    }
    res.json(successResponse(file));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/files/:id/download-url
router.get('/:id/download-url', async (req, res) => {
  try {
    const isOwner = await fileService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Access denied'));
    }
    const url = await fileService.getDownloadUrl(req.params.id);
    if (!url) {
      return res.status(404).json(errorResponse('File not found'));
    }
    res.json(successResponse({ url }));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/files/upload
router.post(
  '/upload',
  validate(
    z.object({
      name: z.string().min(1),
      path: z.string(),
      mimeType: z.string(),
      size: z.number(),
      thumbnail: z.string().optional(),
      folderId: z.string().optional(),
      teamId: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const file = await fileService.create(req.body, req.user!.id);
      res.status(201).json(successResponse(file, 'File uploaded'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/files/folder
router.post(
  '/folder',
  validate(
    z.object({
      name: z.string().min(1),
      parentId: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      // This should use folderService, but for API compatibility
      const { folderService } = await import('../services/folder.service');
      const folder = await folderService.create(req.body, req.user!.id);
      res.status(201).json(successResponse(folder, 'Folder created'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PATCH /api/files/:id/rename
router.patch(
  '/:id/rename',
  validate(z.object({ name: z.string().min(1) })),
  async (req, res) => {
    try {
      const isOwner = await fileService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can rename'));
      }
      const file = await fileService.rename(req.params.id, req.body.name);
      res.json(successResponse(file, 'File renamed'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/files/:id/move
router.post(
  '/:id/move',
  validate(z.object({ folderId: z.string().nullable(), path: z.string() })),
  async (req, res) => {
    try {
      const isOwner = await fileService.isOwner(req.params.id, req.user!.id);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Only owner can move'));
      }
      const file = await fileService.move(req.params.id, req.body.folderId, req.body.path);
      res.json(successResponse(file, 'File moved'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/files/:id/copy
router.post('/:id/copy', async (req, res) => {
  try {
    const file = await fileService.copy(req.params.id, req.user!.id);
    if (!file) {
      return res.status(404).json(errorResponse('File not found'));
    }
    res.status(201).json(successResponse(file, 'File copied'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// PATCH /api/files/:id/favorite
router.patch('/:id/favorite', async (req, res) => {
  try {
    const isOwner = await fileService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only owner can favorite'));
    }
    const file = await fileService.toggleFavorite(req.params.id);
    res.json(successResponse(file, 'Favorite toggled'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/files/:id/share
router.post(
  '/:id/share',
  validate(z.object({ userId: z.string() })),
  async (req, res) => {
    try {
      // Placeholder for file sharing
      res.json(successResponse({ shared: true }, 'File shared'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/files/batch-delete
router.post(
  '/batch-delete',
  validate(z.object({ ids: z.array(z.string()) })),
  async (req, res) => {
    try {
      await fileService.removeMany(req.body.ids, req.user!.id);
      res.json(successResponse(null, 'Files deleted'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/files/:id
router.delete('/:id', async (req, res) => {
  try {
    const isOwner = await fileService.isOwner(req.params.id, req.user!.id);
    if (!isOwner) {
      return res.status(403).json(errorResponse('Only owner can delete'));
    }
    await fileService.remove(req.params.id);
    res.json(successResponse(null, 'File deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
