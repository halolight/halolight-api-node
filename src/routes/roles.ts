import { Router } from 'express';
import { z } from 'zod';
import { roleService } from '../services/role.service';
import { authenticate, requirePermissions } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

router.use(authenticate);

// GET /api/roles
router.get('/', requirePermissions('roles:view'), async (_req, res) => {
  try {
    const roles = await roleService.findAll();
    res.json(successResponse(roles));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/roles/:id
router.get('/:id', requirePermissions('roles:view'), async (req, res) => {
  try {
    const role = await roleService.findOne(req.params.id);
    if (!role) {
      return res.status(404).json(errorResponse('Role not found'));
    }
    res.json(successResponse(role));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/roles
router.post(
  '/',
  requirePermissions('roles:create'),
  validate(
    z.object({
      name: z.string().min(2),
      label: z.string().min(2),
      description: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const role = await roleService.create(req.body);
      res.status(201).json(successResponse(role, 'Role created'));
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json(errorResponse('Role name already exists'));
      }
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// PATCH /api/roles/:id
router.patch(
  '/:id',
  requirePermissions('roles:update'),
  validate(
    z.object({
      name: z.string().min(2).optional(),
      label: z.string().min(2).optional(),
      description: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const role = await roleService.update(req.params.id, req.body);
      res.json(successResponse(role, 'Role updated'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// DELETE /api/roles/:id
router.delete('/:id', requirePermissions('roles:delete'), async (req, res) => {
  try {
    await roleService.remove(req.params.id);
    res.json(successResponse(null, 'Role deleted'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/roles/:id/permissions
router.post(
  '/:id/permissions',
  requirePermissions('roles:update'),
  validate(z.object({ permissionIds: z.array(z.string()) })),
  async (req, res) => {
    try {
      const role = await roleService.assignPermissions(req.params.id, req.body.permissionIds);
      res.json(successResponse(role, 'Permissions assigned'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

export default router;
