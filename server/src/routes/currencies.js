import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const createCurrencySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1).max(255),
  symbol: z.string().max(5),
  exchangeRate: z.number().positive().optional(),
  isBase: z.boolean().optional(),
  decimalPlaces: z.number().int().min(0).max(4).optional(),
});

const convertSchema = z.object({
  amount: z.number().positive(),
  fromCurrencyId: z.string(),
  toCurrencyId: z.string(),
});

// List all currencies
router.get('/', async (req, res) => {
  try {
    const currencies = await req.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [{ isBase: 'desc' }, { code: 'asc' }],
    });
    res.json({ success: true, data: currencies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get currencies for a specific store
router.get('/store/:storeId', async (req, res) => {
  try {
    const currencies = await req.prisma.storeCurrency.findMany({
      where: { storeId: req.params.storeId },
      include: { currency: true },
      orderBy: { isDefault: 'desc' },
    });
    res.json({ success: true, data: currencies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create currency
router.post('/', async (req, res) => {
  try {
    const data = createCurrencySchema.parse(req.body);
    const currency = await req.prisma.currency.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        symbol: data.symbol,
        exchangeRate: data.exchangeRate || 1,
        isBase: data.isBase || false,
        decimalPlaces: data.decimalPlaces || 0,
      },
    });
    res.status(201).json({ success: true, data: currency });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update currency
router.put('/:id', async (req, res) => {
  try {
    const { name, symbol, exchangeRate, isBase, isActive, decimalPlaces } = req.body;
    const currency = await req.prisma.currency.update({
      where: { id: req.params.id },
      data: {
        name,
        symbol,
        exchangeRate,
        isBase,
        isActive,
        decimalPlaces,
      },
    });
    res.json({ success: true, data: currency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add currency to store
router.post('/store/:storeId', async (req, res) => {
  try {
    const { currencyId, rate, isDefault } = req.body;

    if (isDefault) {
      await req.prisma.storeCurrency.updateMany({
        where: { storeId: req.params.storeId },
        data: { isDefault: false },
      });
    }

    const storeCurrency = await req.prisma.storeCurrency.create({
      data: {
        storeId: req.params.storeId,
        currencyId,
        rate: rate || 1,
        isDefault: isDefault || false,
      },
      include: { currency: true },
    });
    res.status(201).json({ success: true, data: storeCurrency });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert currency
router.post('/convert', async (req, res) => {
  try {
    const data = convertSchema.parse(req.body);

    const fromCurrency = await req.prisma.currency.findUnique({
      where: { id: data.fromCurrencyId },
    });
    const toCurrency = await req.prisma.currency.findUnique({
      where: { id: data.toCurrencyId },
    });

    if (!fromCurrency || !toCurrency) {
      return res.status(404).json({ success: false, error: 'Currency not found' });
    }

    // Convert to base first, then to target
    const inBase = data.amount / Number(fromCurrency.exchangeRate);
    const converted = inBase * Number(toCurrency.exchangeRate);

    res.json({
      success: true,
      data: {
        original: data.amount,
        converted: Math.round(converted * Math.pow(10, toCurrency.decimalPlaces)) / Math.pow(10, toCurrency.decimalPlaces),
        from: fromCurrency,
        to: toCurrency,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
