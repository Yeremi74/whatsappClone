import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { emitInboxUpdate } from './socketBus.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

const roomName = (conversationId) => `conv:${conversationId}`;

async function markReadForViewersInRoom(io, conversationId, senderId, messageId) {
  const room = roomName(conversationId);
  const sockets = await io.in(room).fetchSockets();
  for (const s of sockets) {
    const uid = s.data?.userId ?? s.userId;
    if (!uid || String(uid) === String(senderId)) continue;
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: uid }
    });
    emitInboxUpdate(uid);
  }
}

async function assertConversationMember(userId, conversationId) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }
  return Conversation.findOne({
    _id: conversationId,
    users: userId
  });
}

export function setupChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('auth_required'));
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = String(decoded.userId);
      socket.data.userId = socket.userId;
      next();
    } catch {
      next(new Error('auth_invalid'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('joinConversation', async (payload, ack) => {
      const conversationId =
        typeof payload === 'string'
          ? payload
          : payload?.conversationId != null
            ? String(payload.conversationId)
            : '';

      if (!conversationId) {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }

      const conv = await assertConversationMember(socket.userId, conversationId);
      if (!conv) {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }

      socket.join(roomName(conversationId));
      if (typeof ack === 'function') ack({ ok: true });
    });

    socket.on('leaveConversation', (conversationId) => {
      if (!conversationId) return;
      socket.leave(roomName(String(conversationId)));
    });

    socket.on('sendMessage', async ({ conversationId, content, attachments, kind }) => {
      const cid = conversationId != null ? String(conversationId) : '';
      const trimmed =
        typeof content === 'string' ? content.trim().slice(0, 8000) : '';

      let attachmentList = [];
      if (Array.isArray(attachments)) {
        attachmentList = attachments
          .filter((a) => typeof a === 'string' && a.length > 0)
          .slice(0, 3)
          .map((a) => a.slice(0, 2_500_000));
      }

      if (!cid || (!trimmed && attachmentList.length === 0)) {
        return;
      }

      const conv = await assertConversationMember(socket.userId, cid);
      if (!conv) {
        return;
      }

      const message = await Message.create({
        conversationId: conv._id,
        senderId: socket.userId,
        content: trimmed || '\u200b',
        attachments: attachmentList,
        kind: kind
      });

      await Conversation.findByIdAndUpdate(conv._id, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      });

      const populated = await Message.findById(message._id)
        .populate('senderId', 'name profilePicture')
        .lean();

      io.to(roomName(cid)).emit('message:new', populated);

      await markReadForViewersInRoom(io, cid, socket.userId, message._id);

      const fresh = await Conversation.findById(conv._id).select('users').lean();
      if (fresh?.users?.length) {
        fresh.users.forEach((uid) => emitInboxUpdate(String(uid)));
      }
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      const cid = conversationId != null ? String(conversationId) : '';
      if (!cid) return;

      assertConversationMember(socket.userId, cid).then((conv) => {
        if (!conv) return;
        socket.to(roomName(cid)).emit('userTyping', {
          userId: socket.userId,
          isTyping: Boolean(isTyping)
        });
      });
    });
  });
}
