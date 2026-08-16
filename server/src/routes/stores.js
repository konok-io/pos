import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createStoreSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  invoicePrefix: z.string().optional(),
});

const updateStoreSchema = createStoreSchema.partial();

// List all stores
router.get('/', async (req, res) => {
  try {
    const stores = await req.prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        currencies: {
          include: { currency: true },
        },
      },
    });
    res.json({ success: true, data: stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single store
router.get('/:id', async (req, res) => {
  try {
    const store = await req.prisma.store.findUnique({
      where: { id: req.params.id },
      include: {
        currencies: { include: { currency: true } },
        users: true,
        _count: {
          select: {
            products: true,
            customers: true,
            sales: true,
          },
        },
      },
    });
    if (!store) {
      return res.status(404).json({ success: false, error: 'Store not found' });
    }
    res.json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create store
router.post('/', async (req, res) => {
  try {
    const data = createStoreSchema.parse(req.body);
    const store = await req.prisma.store.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        phone: data.phone,
        email: data.email,
        invoicePrefix: data.invoicePrefix || 'INV',
      },
    });
    
    // Add default BDT currency
    const bdtCurrency = await req.prisma.currency.findFirst({
      where: { code: 'BDT' },
    });
    if (bdtCurrency) {
      await req.prisma.storeCurrency.create({
        data: {
          storeId: store.id,
          currencyId: bdtCurrency.id,
          rate: 1,
          isDefault: true,
        },
      });
    }
    
    res.status(201).json({ success: true, data: store });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update store
router.put('/:id', async (req, res) => {
  try {
    const data = updateStoreSchema.parse(req.body);
    const store = await req.prisma.store.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        invoicePrefix: data.invoicePrefix,
        isActive: data.isActive,
      },
    });
    res.json({ success: true, data: store });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete (deactivate) store
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.store.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Store deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
