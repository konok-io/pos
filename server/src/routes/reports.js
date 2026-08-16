import { Router } from 'express';

const router = Router();

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const { storeId, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.toISOString().split('T')[0] + 'T00:00:00');
    const endOfDay = new Date(targetDate.toISOString().split('T')[0] + 'T23:59:59');

    const [
      todaySales,
      todayExpenses,
      todayProfit,
      lowStockProducts,
      recentSales,
      topProducts,
      stats,
    ] = await Promise.all([
      // Today's sales
      req.prisma.sale.aggregate({
        where: { storeId, createdAt: { gte: startOfDay, lte: endOfDay }, status: 'COMPLETED' },
        _sum: { total: true },
        _count: true,
      }),
      // Today's expenses
      req.prisma.expense.aggregate({
        where: { storeId, date: { gte: startOfDay, lte: endOfDay } },
        _sum: { amount: true },
      }),
      // Calculate profit (sales - purchases cost)
      req.prisma.sale.aggregate({
        where: { storeId, createdAt: { gte: startOfDay, lte: endOfDay }, status: 'COMPLETED' },
        _sum: { total: true },
      }),
      // Low stock products
      req.prisma.product.count({
        where: { storeId, stock: { lte: 10 }, isActive: true },
      }),
      // Recent sales
      req.prisma.sale.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customer: true, items: true },
      }),
      // Top selling products
      req.prisma.saleItem.groupBy({
        by: ['productId', 'productName'],
        where: { sale: { storeId, createdAt: { gte: startOfDay, lte: endOfDay } } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Overall stats
      Promise.all([
        req.prisma.product.count({ where: { storeId, isActive: true } }),
        req.prisma.customer.count({ where: { storeId, isActive: true } }),
        req.prisma.category.count({ where: { storeId, isActive: true } }),
      ]),
    ]);

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        todaySales: {
          count: todaySales._count || 0,
          total: todaySales._sum.total || 0,
        },
        todayExpenses: todayExpenses._sum.amount || 0,
        lowStockCount: lowStockProducts,
        recentSales,
        topProducts,
        stats: {
          totalProducts: stats[0],
          totalCustomers: stats[1],
          totalCategories: stats[2],
        },
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Profit & Loss report
router.get('/profit-loss', async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;

    const where = {
      storeId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      },
      status: 'COMPLETED',
    };

    const [salesData, purchasesData, expensesData] = await Promise.all([
      req.prisma.sale.aggregate({
        where,
        _sum: { total: true, discount: true },
        _count: true,
      }),
      req.prisma.purchase.aggregate({
        where: { storeId, createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59') } },
        _sum: { total: true },
      }),
      req.prisma.expense.aggregate({
        where: { storeId, date: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59') } },
        _sum: { amount: true },
      }),
    ]);

    const totalSales = Number(salesData._sum.total || 0);
    const totalPurchases = Number(purchasesData._sum.total || 0);
    const totalExpenses = Number(expensesData._sum.amount || 0);
    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      success: true,
      data: {
        startDate,
        endDate,
        totalSales,
        totalPurchases,
        totalExpenses,
        grossProfit,
        netProfit,
        salesCount: salesData._count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stock report
router.get('/stock', async (req, res) => {
  try {
    const { storeId, lowStock } = req.query;

    const where = { storeId, isActive: true };
    if (lowStock === 'true') where.stock = { lte: 10 };

    const products = await req.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { stock: 'asc' },
    });

    const totalValue = products.reduce((sum, p) => sum + Number(p.sellPrice) * p.stock, 0);
    const totalCost = products.reduce((sum, p) => sum + Number(p.costPrice) * p.stock, 0);

    res.json({
      success: true,
      data: {
        products,
        summary: {
          totalProducts: products.length,
          totalItems: products.reduce((sum, p) => sum + p.stock, 0),
          totalValue,
          totalCost,
          potentialProfit: totalValue - totalCost,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
