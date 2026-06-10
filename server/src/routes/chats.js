const express = require('express');
const { authenticate } = require('../middleware/auth');
const { prisma, broadcastToChat } = require('../index');

const router = express.Router();

// Get user's chats
router.get('/', authenticate, async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: { userId: req.user.id }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        owner: {
          select: { id: true, username: true, displayName: true }
        },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, username: true, displayName: true }
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Add unread count
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const membership = await prisma.chatMember.findFirst({
          where: { chatId: chat.id, userId: req.user.id }
        });

        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            senderId: { not: req.user.id },
            createdAt: { gt: membership?.lastRead || new Date(0) },
            isDeleted: false
          }
        });

        return { ...chat, unreadCount };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Create chat
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, type = 'DIRECT', memberIds, isEncrypted = true } = req.body;

    // For direct chats, check if already exists
    if (type === 'DIRECT' && memberIds.length === 1) {
      const existing = await prisma.chat.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { members: { some: { userId: req.user.id } } },
            { members: { some: { userId: memberIds[0] } } }
          ]
        }
      });

      if (existing) {
        return res.json(existing);
      }
    }

    const chat = await prisma.chat.create({
      data: {
        name: type === 'DIRECT' ? null : name,
        type,
        ownerId: req.user.id,
        isEncrypted,
        members: {
          create: [
            { userId: req.user.id, role: 'OWNER' },
            ...memberIds.map(id => ({ userId: id, role: 'MEMBER' }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true
              }
            }
          }
        }
      }
    });

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get chat details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
                status: true
              }
            }
          }
        },
        owner: {
          select: { id: true, username: true, displayName: true }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// Get pinned message
router.get('/:id/pinned', authenticate, async (req, res) => {
  try {
    const chat = await prisma.chat.findUnique({
      where: { id: req.params.id },
      select: { pinnedMessageId: true }
    });

    if (!chat?.pinnedMessageId) {
      return res.json(null);
    }

    const message = await prisma.message.findUnique({
      where: { id: chat.pinnedMessageId },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true }
        }
      }
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pinned message' });
  }
});

module.exports = router;
