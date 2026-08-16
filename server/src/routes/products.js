import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  storeId: z.string(),
  costPrice: z.number().positive(),
  sellPrice: z.number().positive(),
  stock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  image: z.string().optional(),
});

// List products
router.get('/', async (req, res) => {
  try {
    const { storeId, categoryId, search, sort } = req.query;
    
    const where = { isActive: true };
    if (storeId) where.storeId = storeId;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {};
    switch (sort) {
      case 'name': orderBy.name = 'asc'; break;
      case 'price_asc': orderBy.sellPrice = 'asc'; break;
      case 'price_desc': orderBy.sellPrice = 'desc'; break;
      case 'stock': orderBy.stock = 'desc'; break;
      default: orderBy.name = 'asc';
    }

    const products = await req.prisma.product.findMany({
      where,
      orderBy,
      include: { category: true },
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await req.prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, store: true },
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Find by barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const product = await req.prisma.product.findFirst({
      where: { barcode: req.params.barcode, isActive: true },
      include: { category: true },
    });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await req.prisma.product.create({
      data: {
        name: data.name,
        code: data.code,
        barcode: data.barcode,
        description: data.description,
        categoryId: data.categoryId,
        storeId: data.storeId,
        costPrice: data.costPrice,
        sellPrice: data.sellPrice,
        stock: data.stock || 0,
        unit: data.unit,
        image: data.image,
      },
      include: { category: true },
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Product code already exists for this store' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, description, categoryId, costPrice, sellPrice, stock, unit, image, isActive } = req.body;
    const product = await req.prisma.product.update({
      where: { id: req.params.id },
      data: {
        name, description, categoryId, costPrice, sellPrice, stock, unit, image, isActive,
      },
      include: { category: true },
    });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
