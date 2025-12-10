import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';

const router: Router = Router();

router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (_req, res) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(successResponse(stats));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/dashboard/visits
router.get('/visits', async (_req, res) => {
  try {
    const visits = await dashboardService.getVisits();
    res.json(successResponse(visits));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/dashboard/sales
router.get('/sales', async (_req, res) => {
  try {
    const sales = await dashboardService.getSales();
    res.json(successResponse(sales));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/dashboard/products
router.get('/products', async (_req, res) => {
  try {
    const products = await dashboardService.getProducts();
    res.json(successResponse(products));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/dashboard/orders
router.get('/orders', async (_req, res) => {
  try {
    const orders = await dashboardService.getOrders();
    res.json(successResponse(orders));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/dashboard/activities
router.get('/activities', async (_req, res) => {
  try {
    const activities = await dashboardService.getActivities();
    res.json(successResponse(activities));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/dashboard/pie
router.get('/pie', async (_req, res) => {
  try {
    const pieData = await dashboardService.getPieData();
    res.json(successResponse(pieData));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/dashboard/tasks
router.get('/tasks', async (_req, res) => {
  try {
    const tasks = await dashboardService.getTasks();
    res.json(successResponse(tasks));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

// GET /api/dashboard/overview
router.get('/overview', async (_req, res) => {
  try {
    const overview = await dashboardService.getOverview();
    res.json(successResponse(overview));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
});

export default router;
