import { prisma } from '../utils/prisma';

export const dashboardService = {
  async getStats() {
    const [
      totalUsers,
      activeUsers,
      totalDocuments,
      totalFiles,
      totalTeams,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.document.count(),
      prisma.file.count(),
      prisma.team.count(),
      prisma.activityLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      documents: { total: totalDocuments },
      files: { total: totalFiles },
      teams: { total: totalTeams },
      activities: { recent: recentActivities },
    };
  },

  async getVisits() {
    // Mock data for 7-day visit trends
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      day,
      visits: Math.floor(Math.random() * 1000) + 500,
      uniqueVisitors: Math.floor(Math.random() * 500) + 200,
    }));
  },

  async getSales() {
    // Mock data for 6-month sales trends
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month) => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 500) + 100,
    }));
  },

  async getProducts() {
    // Mock top products
    return [
      { id: '1', name: 'Product A', sales: 1234, revenue: 12340 },
      { id: '2', name: 'Product B', sales: 987, revenue: 9870 },
      { id: '3', name: 'Product C', sales: 765, revenue: 7650 },
      { id: '4', name: 'Product D', sales: 543, revenue: 5430 },
      { id: '5', name: 'Product E', sales: 321, revenue: 3210 },
    ];
  },

  async getOrders() {
    // Mock recent orders
    return [
      { id: '1', customer: 'John Doe', amount: 299, status: 'completed', date: new Date() },
      { id: '2', customer: 'Jane Smith', amount: 199, status: 'pending', date: new Date() },
      { id: '3', customer: 'Bob Wilson', amount: 499, status: 'processing', date: new Date() },
      { id: '4', customer: 'Alice Brown', amount: 149, status: 'completed', date: new Date() },
      { id: '5', customer: 'Charlie Davis', amount: 399, status: 'shipped', date: new Date() },
    ];
  },

  async getActivities() {
    const activities = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return activities;
  },

  async getPieData() {
    // Mock category breakdown
    return [
      { name: 'Documents', value: 35 },
      { name: 'Images', value: 25 },
      { name: 'Videos', value: 20 },
      { name: 'Audio', value: 10 },
      { name: 'Others', value: 10 },
    ];
  },

  async getTasks() {
    // Mock task list
    return {
      total: 24,
      completed: 18,
      pending: 6,
      tasks: [
        { id: '1', title: 'Review documents', status: 'completed', priority: 'high' },
        { id: '2', title: 'Update user permissions', status: 'pending', priority: 'medium' },
        { id: '3', title: 'Deploy new features', status: 'in_progress', priority: 'high' },
        { id: '4', title: 'Fix reported bugs', status: 'pending', priority: 'low' },
      ],
    };
  },

  async getOverview() {
    const [userCount, docCount, fileCount, teamCount] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.file.count(),
      prisma.team.count(),
    ]);

    return {
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
      },
      database: {
        users: userCount,
        documents: docCount,
        files: fileCount,
        teams: teamCount,
      },
    };
  },
};
