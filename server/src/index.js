const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Store WebSocket connections
const clients = new Map();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Broadcast function
function broadcastToChat(chatId, data, excludeUserId = null) {
  clients.forEach((ws, userId) => {
    if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/files', require('./routes/files'));
app.use('/api/calls', require('./routes/calls'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/voice', require('./routes/voice'));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// WebSocket handling
wss.on('connection', (ws, req) => {
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'auth':
          const user = await prisma.user.findUnique({
            where: { id: data.userId },
            select: { id: true, username: true, displayName: true, avatar: true }
          });
          if (user) {
            clients.set(user.id, ws);
            ws.userId = user.id;

            await prisma.user.update({
              where: { id: user.id },
              data: { isOnline: true, lastSeen: new Date() }
            });

            broadcastToChat(null, {
              type: 'user_status',
              userId: user.id,
              isOnline: true
            });
          }
          break;

        case 'typing':
          broadcastToChat(data.chatId, {
            type: 'typing',
            chatId: data.chatId,
            userId: ws.userId,
            isTyping: true
          }, ws.userId);
          break;

        case 'message':
          broadcastToChat(data.chatId, {
            type: 'new_message',
            message: data.message
          });
          break;

        case 'reaction':
          broadcastToChat(data.chatId, {
            type: 'reaction',
            messageId: data.messageId,
            userId: ws.userId,
            emoji: data.emoji
          });
          break;

        case 'call_offer':
        case 'call_answer':
        case 'call_ice':
        case 'call_end':
          const targetWs = clients.get(data.targetUserId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({ type: data.type, ...data }));
          }
          break;

        case 'voice_message':
          broadcastToChat(data.chatId, {
            type: 'voice_message',
            voiceMessage: data.voiceMessage
          });
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });

  ws.on('close', async () => {
    if (ws.userId) {
      clients.delete(ws.userId);
      await prisma.user.update({
        where: { id: ws.userId },
        data: { isOnline: false, lastSeen: new Date() }
      });
      broadcastToChat(null, {
        type: 'user_status',
        userId: ws.userId,
        isOnline: false
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`G-Chat server running on port ${PORT}`);
  console.log(`WebSocket server running on path /ws`);
});
