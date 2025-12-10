import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { validate } from '../utils/validate';

const router: Router = Router();

// POST /api/auth/login
router.post(
  '/login',
  validate(z.object({ email: z.string().email(), password: z.string().min(6) })),
  async (req, res) => {
    try {
      const result = await authService.login(
        req.body.email,
        req.body.password,
        req.ip,
        req.headers['user-agent']
      );
      if (!result) {
        return res.status(401).json(errorResponse('Invalid credentials'));
      }
      res.json(successResponse(result));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/auth/register
router.post(
  '/register',
  validate(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
      username: z.string().min(3).optional(),
      phone: z.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(successResponse(result, 'Registration successful'));
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json(errorResponse('Email or username already exists'));
      }
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validate(z.object({ refreshToken: z.string() })),
  async (req, res) => {
    try {
      const tokens = await authService.refresh(
        req.body.refreshToken,
        req.ip,
        req.headers['user-agent']
      );
      if (!tokens) {
        return res.status(401).json(errorResponse('Invalid or expired refresh token'));
      }
      res.json(successResponse(tokens));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await authService.logout(req.user!.id, req.body?.refreshToken);
    res.json(successResponse(true, 'Logout successful'));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await authService.me(req.user!.id);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }
    res.json(successResponse(user));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  validate(z.object({ email: z.string().email() })),
  async (req, res) => {
    try {
      await authService.forgotPassword(req.body.email);
      res.json(
        successResponse(
          true,
          'If an account with that email exists, a password reset link has been sent'
        )
      );
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  validate(z.object({ token: z.string(), password: z.string().min(6) })),
  async (req, res) => {
    try {
      const ok = await authService.resetPassword(req.body.token, req.body.password);
      if (!ok) {
        return res.status(400).json(errorResponse('Invalid or expired reset token'));
      }
      res.json(successResponse(true, 'Password has been reset successfully'));
    } catch (error: any) {
      res.status(500).json(errorResponse(error.message));
    }
  }
);

export default router;
