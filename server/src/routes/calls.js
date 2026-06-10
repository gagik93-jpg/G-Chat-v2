const express = require('express');
const { authenticate } = require('../middleware/auth');
const { prisma } = require('../index');

const router = express.Router();

// Initiate call
router.post('/', authenticate, async (req, res) => {
  try {
    const { chatId, type = 'VIDEO', isGroup = false } = req.body;

    const membership = await prisma.chatMember.findFirst({
      where: { chatId, userId: req.user.id }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member' });
    }

    const call = await prisma.call.create({
      data: {
        chatId,
        initiatedBy: req.user.id,
        type,
        isGroup,
        status: 'RINGING',
        participants: {
          create: {
            userId: req.user.id,
            joinedAt: new Date()
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true }
            }
          }
        }
      }
    });

    res.json(call);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Join call
router.post('/:callId/join', authenticate, async (req, res) => {
  try {
    const { callId } = req.params;

    const participant = await prisma.callParticipant.create({
      data: {
        callId,
        userId: req.user.id,
        joinedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true }
        }
      }
    });

    await prisma.call.update({
      where: { id: callId },
      data: { status: 'CONNECTED', startedAt: new Date() }
    });

    res.json(participant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join call' });
  }
});

// Leave call
router.post('/:callId/leave', authenticate, async (req, res) => {
  try {
    const { callId } = req.params;

    await prisma.callParticipant.updateMany({
      where: {
        callId,
        userId: req.user.id,
        leftAt: null
      },
      data: { leftAt: new Date() }
    });

    const activeParticipants = await prisma.callParticipant.count({
      where: {
        callId,
        leftAt: null
      }
    });

    if (activeParticipants === 0) {
      await prisma.call.update({
        where: { id: callId },
        data: { status: 'ENDED', endedAt: new Date() }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave call' });
  }
});

// Get call history
router.get('/history/:chatId', authenticate, async (req, res) => {
  try {
    const calls = await prisma.call.findMany({
      where: { chatId: req.params.chatId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get call history' });
  }
});

module.exports = router;
