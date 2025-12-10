import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router: Router = Router();

// Validation schemas
const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
  }),
});

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
    role: z.string().optional(),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    name: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
  }),
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

const getUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

// All routes require authentication
router.use(authenticate);

// GET /api/users - List users (admin only)
router.get(
  '/',
  requireRole('ADMIN'),
  validate(listUsersSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await userService.findAll(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/users/:id - Get user by ID
router.get(
  '/:id',
  validate(getUserSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.findOne(req.params.id);

      if (!user) {
        res.status(404).json({
          message: 'User not found',
          code: 'NOT_FOUND',
        });
        return;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/users - Create user (admin only)
router.post(
  '/',
  requireRole('ADMIN'),
  validate(createUserSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/users/:id - Update user
router.put(
  '/:id',
  validate(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user can update this profile
      const requestingUserId = req.user?.id;
      const targetUserId = req.params.id;
      const isAdmin = req.user?.roles?.some((r) => r.role.name === 'ADMIN');

      // Users can only update their own profile unless they're admin
      if (requestingUserId !== targetUserId && !isAdmin) {
        res.status(403).json({
          message: 'You can only update your own profile',
          code: 'FORBIDDEN',
        });
        return;
      }

      // Only admins can update roles
      if (req.body.role && !isAdmin) {
        res.status(403).json({
          message: 'Only admins can update user roles',
          code: 'FORBIDDEN',
        });
        return;
      }

      const user = await userService.update(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/users/:id - Delete user (admin only)
router.delete(
  '/:id',
  requireRole('ADMIN'),
  validate(getUserSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.remove(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
