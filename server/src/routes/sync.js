import { Router } from 'express';

const router = Router();

// Pull data from server
router.get('/pull/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { since } = req.query;
    const sinceDate = since ? new Date(since) : null;

    const [categories, products, customers, currencies, sales] = await Promise.all([
      req.prisma.category.findMany({
        where: { storeId, isActive: true, ...(sinceDate && { updatedAt: { gte: sinceDate } }) },
      }),
      req.prisma.product.findMany({
        where: { storeId, isActive: true, ...(sinceDate && { updatedAt: { gte: sinceDate } }) },
        include: { category: true },
      }),
      req.prisma.customer.findMany({
        where: { storeId, isActive: true, ...(sinceDate && { updatedAt: { gte: sinceDate } }) },
      }),
      req.prisma.storeCurrency.findMany({
        where: { storeId },
        include: { currency: true },
      }),
      req.prisma.sale.findMany({
        where: { storeId, ...(sinceDate && { updatedAt: { gte: sinceDate } }) },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    res.json({
      success: true,
      data: {
        categories,
        products,
        customers,
        currencies,
        sales,
        syncedAt: new Date().toISOString(),
        storeId,
      },
    });
  } catch (error) {
    console.error('Sync pull error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Push data to server (sync offline sales)
router.post('/push/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { sales: offlineSales, deviceId } = req.body;

    const results = {
      sales: { synced: 0, failed: 0, errors: [] },
    };

    if (offlineSales && Array.isArray(offlineSales)) {
      for (const saleData of offlineSales) {
        try {
          // Check if already synced
          if (saleData.offlineId) {
            const existing = await req.prisma.sale.findFirst({
              where: { offlineId: saleData.offlineId },
            });
            if (existing) {
              results.sales.synced++;
              continue;
            }
          }

          // Create the sale
          const sale = await req.prisma.sale.create({
            data: {
              invoiceNo: saleData.invoiceNo || `OFFLINE${Date.now()}`,
              storeId,
              customerId: saleData.customerId,
              currencyId: saleData.currencyId,
              subtotal: saleData.subtotal,
              discount: saleData.discount || 0,
              vat: saleData.vat || 0,
              total: saleData.total,
              paid: saleData.paid,
              change: saleData.change || 0,
              paymentMethod: saleData.paymentMethod || 'CASH',
              offlineId: saleData.offlineId,
              deviceId,
              createdAt: saleData.date ? new Date(saleData.date) : new Date(),
              items: {
                create: (saleData.items || []).map(item => ({
                  productId: item.productId || item.product_id,
                  productName: item.productName || item.product_name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice || item.unit_price,
                  total: item.total,
                })),
              },
            },
          });

          // Update stock
          for (const item of saleData.items || []) {
            await req.prisma.product.update({
              where: { id: item.productId || item.product_id },
              data: { stock: { decrement: item.quantity } },
            });
          }

          results.sales.synced++;
        } catch (err) {
          results.sales.failed++;
          results.sales.errors.push({
            offlineId: saleData.offlineId,
            error: err.message,
          });
        }
      }
    }

    res.json({
      success: true,
      data: results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync push error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sync status
router.get('/status/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const lastSync = await req.prisma.sale.findFirst({
      where: { storeId, offlineId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        lastSync: lastSync?.createdAt?.toISOString() || null,
        pendingSync: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
