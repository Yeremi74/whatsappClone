import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { emitInboxUpdate } from '../socket/socketBus.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
};

const listConversations = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const conversations = await Conversation.find({ users: currentUserId })
      .populate('users', 'name email profilePicture')
      .populate({
        path: 'lastMessage',
        select: 'content senderId createdAt'
      })
      .sort({ lastMessageAt: -1 });

    const data = await Promise.all(
      conversations.map(async (c) => {
        const otherUser = c.users.find(
          (u) => String(u._id) !== String(currentUserId)
        );
        const unreadCount = await Message.countDocuments({
          conversationId: c._id,
          senderId: { $ne: currentUserId },
          deleted: false,
          readBy: { $nin: [currentUserId] }
        });
        const lastMessageFromMe =
          c.lastMessage &&
          String(c.lastMessage.senderId) === String(currentUserId);
        return {
          conversationId: c._id,
          otherUser,
          lastMessage: c.lastMessage,
          lastMessageFromMe: Boolean(lastMessageFromMe),
          lastMessageAt: c.lastMessageAt,
          unreadCount
        };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const openConversationWithUser = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const { userId } = req.params;
    const peerId = userId != null ? String(userId).trim() : '';

    if (!peerId || !mongoose.Types.ObjectId.isValid(peerId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario inválido'
      });
    }

    if (String(currentUserId) === peerId) {
      return res.status(400).json({
        success: false,
        error: 'No puedes abrir un chat contigo mismo'
      });
    }

    const friend = await FriendRequest.findOne({
      $or: [
        { from: currentUserId, to: peerId },
        { from: peerId, to: currentUserId }
      ],
      status: 'accepted'
    });

    if (!friend) {
      return res.status(403).json({
        success: false,
        error: 'Solo puedes chatear con usuarios que sean tus amigos'
      });
    }

    const peer = await User.findById(peerId).select('name email profilePicture');
    if (!peer) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    let conversation = await Conversation.findOne({
      users: { $all: [currentUserId, peerId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        users: [currentUserId, peerId],
        lastMessageAt: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        peer
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de conversación inválido'
      });
    }

    const conv = await Conversation.findOne({
      _id: conversationId,
      users: currentUserId
    });

    if (!conv) {
      return res.status(404).json({
        success: false,
        error: 'Conversación no encontrada'
      });
    }

    const messages = await Message.find({
      conversationId: conv._id,
      deleted: false
    })
      .sort({ createdAt: 1 })
      .limit(300)
      .populate('senderId', 'name profilePicture');

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const markConversationRead = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de conversación inválido'
      });
    }

    const conv = await Conversation.findOne({
      _id: conversationId,
      users: currentUserId
    });

    if (!conv) {
      return res.status(404).json({
        success: false,
        error: 'Conversación no encontrada'
      });
    }

    await Message.updateMany(
      {
        conversationId: conv._id,
        senderId: { $ne: currentUserId },
        readBy: { $nin: [currentUserId] }
      },
      { $addToSet: { readBy: currentUserId } }
    );

    emitInboxUpdate(currentUserId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { listConversations, openConversationWithUser, getMessages, markConversationRead };
