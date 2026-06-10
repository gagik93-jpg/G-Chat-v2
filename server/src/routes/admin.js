const express = require('express');
const { authenticate, isAdmin } = require('../middleware/auth');
const { prisma } = require('../index');

const router = express.Router();

// All routes require admin
router.use(authenticate, isAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalChats,
      totalMessages,
      totalCalls,
      activeUsers,
      newUsersToday
    ] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.call.count(),
      prisma.user.count({ where: { isOnline: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      totalUsers,
      totalChats,
      totalMessages,
      totalCalls,
      activeUsers,
      newUsersToday
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        isOnline: true,
        lastSeen: true,
        isActive: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            messages: true,
            chats: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Ban/unban user
router.post('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, username: true, isActive: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all chats
router.get('/chats', async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      include: {
        owner: {
          select: { id: true, username: true, displayName: true }
        },
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Server logs (mock)
router.get('/logs', async (req, res) => {
  res.json([
    { time: new Date().toISOString(), level: 'info', message: 'Server started' },
    { time: new Date().toISOString(), level: 'info', message: 'Database connected' }
  ]);
});

module.exports = router;
