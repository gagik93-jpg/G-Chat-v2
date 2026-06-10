const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Храним связи userId -> Set of WebSockets
const clients = new Map();

function initSocketManager(wss) {
  async function broadcastToChat(chatId, data, excludeUserId = null) {
    try {
      if (!chatId) {
        // Системный статус онлайн/оффлайн — шлем всем
        clients.forEach((wsSet) => {
          wsSet.forEach(ws => {
            if (ws.readyState === 1) ws.send(JSON.stringify(data));
          });
        });
        return;
      }

      // Находим только участников этого чата
      const members = await prisma.chatMember.findMany({
        where: { chatId },
        select: { userId: true }
      });

      const memberIds = members.map(m => m.userId);

      memberIds.forEach(userId => {
        if (userId === excludeUserId) return;
        const wsSet = clients.get(userId);
        if (wsSet) {
          wsSet.forEach(ws => {
            if (ws.readyState === 1) ws.send(JSON.stringify(data));
          });
        }
      });
    } catch (err) {
      console.error("Broadcast error:", err);
    }
  }

  return { clients, broadcastToChat };
}

module.exports = { initSocketManager };
