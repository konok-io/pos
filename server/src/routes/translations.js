import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all translations for a language
router.get('/:lang', async (req, res) => {
  try {
    const { lang } = req.params;
    const translations = await prisma.translation.findMany({
      where: { lang },
      orderBy: { key: 'asc' }
    });
    
    // Convert to key-value object
    const translationMap = {};
    translations.forEach(t => {
      translationMap[t.key] = t.value;
    });
    
    res.json(translationMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all translations for all languages
router.get('/', async (req, res) => {
  try {
    const translations = await prisma.translation.findMany({
      orderBy: [{ lang: 'asc' }, { key: 'asc' }]
    });
    
    // Group by language
    const grouped = {};
    translations.forEach(t => {
      if (!grouped[t.lang]) {
        grouped[t.lang] = {};
      }
      grouped[t.lang][t.key] = t.value;
    });
    
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync translations from code (receives all keys with values)
router.post('/sync', async (req, res) => {
  try {
    const { translations } = req.body;
    const results = { added: 0, updated: 0, errors: [] };

    for (const [lang, keys] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(keys)) {
        try {
          // Upsert each translation
          const existing = await prisma.translation.findUnique({
            where: { lang_key: { lang, key } }
          });

          if (existing) {
            // Update if not custom
            if (!existing.isCustom) {
              await prisma.translation.update({
                where: { id: existing.id },
                data: { value, isCustom: false }
              });
              results.updated++;
            }
          } else {
            // Create new
            await prisma.translation.create({
              data: { lang, key, value, isCustom: false }
            });
            results.added++;
          }
        } catch (e) {
          results.errors.push({ lang, key, error: e.message });
        }
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update or create a single translation
router.put('/:lang/:key', async (req, res) => {
  try {
    const { lang, key } = req.params;
    const { value } = req.body;

    const translation = await prisma.translation.upsert({
      where: { lang_key: { lang, key } },
      update: { value, isCustom: true },
      create: { lang, key, value, isCustom: true }
    });

    res.json(translation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a custom translation (only if isCustom is true)
router.delete('/:lang/:key', async (req, res) => {
  try {
    const { lang, key } = req.params;

    const translation = await prisma.translation.findUnique({
      where: { lang_key: { lang, key } }
    });

    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    if (!translation.isCustom) {
      return res.status(403).json({ error: 'Cannot delete system translation' });
    }

    await prisma.translation.delete({
      where: { id: translation.id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
