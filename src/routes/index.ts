import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import roleRoutes from './roles';
import permissionRoutes from './permissions';
import teamRoutes from './teams';
import documentRoutes from './documents';
import fileRoutes from './files';
import folderRoutes from './folders';
import calendarRoutes from './calendar';
import notificationRoutes from './notifications';
import messageRoutes from './messages';
import dashboardRoutes from './dashboard';

const router: Router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/teams', teamRoutes);
router.use('/documents', documentRoutes);
router.use('/files', fileRoutes);
router.use('/folders', folderRoutes);
router.use('/calendar', calendarRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
