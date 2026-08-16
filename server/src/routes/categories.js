import { Router } from 'express';

const router = Router();

// List categories
router.get('/', async (req, res) => {
  try {
    const { storeId } = req.query;
    const where = { isActive: true };
    if (storeId) where.storeId = storeId;

    const categories = await req.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    const { name, icon, storeId } = req.body;
    const category = await req.prisma.category.create({
      data: { name, icon, storeId },
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, icon } = req.body;
    const category = await req.prisma.category.update({
      where: { id: req.params.id },
      data: { name, icon },
    });
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.category.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
