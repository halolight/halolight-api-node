import { Router } from 'express';
import { z } from 'zod';
import { permissionService } from '../services/permission.service';
import { authenticate, requirePermissions } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/permissions
router.get('/', requirePermissions('permissions:view'), async (_req, res) => {
  try {
    const permissions = await permissionService.findAll();
    res.json(successResponse(permissions));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/permissions/:id
router.get('/:id', requirePermissions('permissions:view'), async (req, res) => {
  try {
    const permission = await permissionService.findOne(req.params.id);
    if (!permission) {
      return res.status(404).json(errorResponse('Permission not found'));
    }
    res.json(successResponse(permission));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/permissions
router.post(
  '/',
  requirePermissions('permissions:create'),
  validate(
    z.object({
      action: z.string().min(1),
      resource: z.string().min(1),
      description: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const permission = await permissionService.create(req.body);
      res.status(201).json(successResponse(permission, 'Permission created'));
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json(errorResponse('Permission already exists'));
      }
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/permissions/:id
router.delete('/:id', requirePermissions('permissions:delete'), async (req, res) => {
  try {
    await permissionService.remove(req.params.id);
    res.json(successResponse(null, 'Permission deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
