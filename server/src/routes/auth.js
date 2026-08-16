import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Simple auth (for demo - in production use proper JWT)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // For demo, accept any credentials
    const user = await req.prisma.user.findFirst({
      where: { email, isActive: true },
      include: { store: true },
    });

    if (!user) {
      // Create demo user if none exists
      const store = await req.prisma.store.findFirst();
      if (!store) {
        return res.status(404).json({ success: false, error: 'No store found' });
      }

      const newUser = await req.prisma.user.create({
        data: {
          name: 'Admin',
          email: email || 'admin@pos.test',
          password: password || 'admin123',
          role: 'admin',
          storeId: store.id,
        },
        include: { store: true },
      });

      return res.json({
        success: true,
        data: {
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
          store: newUser.store,
          token: `demo_token_${newUser.id}`,
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        store: user.store,
        token: `demo_token_${user.id}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: userId },
      include: { store: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        store: user.store,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
