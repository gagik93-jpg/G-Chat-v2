const express = require('express');
const { authenticate } = require('../middleware/auth');
const { prisma, broadcastToChat } = require('../index');

const router = express.Router();

// Get messages for chat
router.get('/:chatId', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check membership
    const membership = await prisma.chatMember.findFirst({
      where: { chatId, userId: req.user.id }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true }
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, username: true, displayName: true }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        },
        _count: {
          select: { replies: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Update last read
    await prisma.chatMember.update({
      where: { id: membership.id },
      data: { lastRead: new Date() }
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/:chatId', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, contentType = 'TEXT', replyToId, fileUrl, fileName, fileSize } = req.body;

    const membership = await prisma.chatMember.findFirst({
      where: { chatId, userId: req.user.id }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: req.user.id,
        content,
        contentType,
        replyToId: replyToId || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true }
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, username: true, displayName: true }
            }
          }
        },
        reactions: true
      }
    });

    // Update chat updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    // Broadcast
    broadcastToChat(chatId, {
      type: 'new_message',
      message
    });

    res.json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Add reaction
router.post('/:messageId/reaction', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Toggle reaction
    const existing = await prisma.reaction.findFirst({
      where: {
        messageId,
        userId: req.user.id,
        emoji
      }
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.reaction.create({
        data: {
          messageId,
          userId: req.user.id,
          emoji
        }
      });
    }

    const reactions = await prisma.reaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, username: true }
        }
      }
    });

    broadcastToChat(message.chatId, {
      type: 'reaction',
      messageId,
      reactions
    });

    res.json(reactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Delete message (for me)
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete for all
    if (message.senderId === req.user.id) {
      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, deletedForAll: true }
      });

      broadcastToChat(message.chatId, {
        type: 'message_deleted',
        messageId
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Pin message
router.post('/:messageId/pin', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await prisma.chat.update({
      where: { id: message.chatId },
      data: { pinnedMessageId: messageId }
    });

    broadcastToChat(message.chatId, {
      type: 'message_pinned',
      messageId
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to pin message' });
  }
});

// Search messages
router.get('/:chatId/search', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q } = req.query;

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        content: {
          contains: q,
          mode: 'insensitive'
        },
        isDeleted: false
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
