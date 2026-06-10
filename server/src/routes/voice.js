const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const { prisma, broadcastToChat } = require('../index');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/voice/');
  },
  filename: (req, file, cb) => {
    cb(null, `voice-${uuidv4()}.webm`);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Upload voice message
router.post('/upload/:chatId', authenticate, upload.single('voice'), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { duration, waveform } = req.body;

    // Check membership
    const membership = await prisma.chatMember.findFirst({
      where: { chatId, userId: req.user.id }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const voiceMessage = await prisma.voiceMessage.create({
      data: {
        chatId,
        senderId: req.user.id,
        fileUrl: `/uploads/voice/${req.file.filename}`,
        duration: parseInt(duration) || 0,
        waveform: waveform || null
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true }
        }
      }
    });

    // Broadcast via WebSocket
    broadcastToChat(chatId, {
      type: 'voice_message',
      voiceMessage
    });

    res.json(voiceMessage);
  } catch (error) {
    console.error('Voice upload error:', error);
    res.status(500).json({ error: 'Failed to upload voice message' });
  }
});

// Get voice messages for chat
router.get('/:chatId', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await prisma.voiceMessage.findMany({
      where: { chatId },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get voice messages' });
  }
});

module.exports = router;
