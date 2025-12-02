import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';

const router: Router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
