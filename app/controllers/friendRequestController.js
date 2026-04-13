import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

// Helper para obtener userId del token
const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

// Crear solicitud de amistad
const createFriendRequest = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);
    
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const rawUserId = req.body?.userId;
    const userId = rawUserId != null ? String(rawUserId).trim() : '';

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID del usuario destinatario es requerido'
      });
    }

    if (String(currentUserId) === userId) {
      return res.status(400).json({
        success: false,
        error: 'No puedes enviarte una solicitud de amistad a ti mismo'
      });
    }

    // Verificar que el usuario destinatario existe
    const toUser = await User.findById(userId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario destinatario no encontrado'
      });
    }

    // Verificar si ya existe una solicitud pendiente
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId }
      ],
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una solicitud de amistad pendiente con este usuario'
      });
    }

    const friendRequest = new FriendRequest({
      from: currentUserId,
      to: userId,
      status: 'pending'
    });

    await friendRequest.save();
    await friendRequest.populate('from', 'name email profilePicture');
    await friendRequest.populate('to', 'name email profilePicture');

    res.status(201).json({ 
      success: true, 
      data: friendRequest 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Obtener solicitudes recibidas (pendientes)
const getReceivedFriendRequests = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);
    
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const friendRequests = await FriendRequest.find({
      to: currentUserId,
      status: 'pending'
    })
    .populate('from', 'name email profilePicture')
    .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: friendRequests 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Aceptar solicitud de amistad
const acceptFriendRequest = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);
    
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud de amistad no encontrada'
      });
    }

    if (friendRequest.to.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para aceptar esta solicitud'
      });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Esta solicitud ya fue procesada'
      });
    }

    friendRequest.status = 'accepted';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();

    await friendRequest.populate('from', 'name email profilePicture');
    await friendRequest.populate('to', 'name email profilePicture');

    res.json({ 
      success: true, 
      data: friendRequest 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Rechazar solicitud de amistad
const rejectFriendRequest = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);
    
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud de amistad no encontrada'
      });
    }

    if (friendRequest.to.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para rechazar esta solicitud'
      });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Esta solicitud ya fue procesada'
      });
    }

    friendRequest.status = 'rejected';
    friendRequest.updatedAt = new Date();
    await friendRequest.save();

    res.json({ 
      success: true, 
      message: 'Solicitud rechazada',
      data: friendRequest 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

const getFriendRequestStatus = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const userId =
      req.params.userId != null ? String(req.params.userId).trim() : '';

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'ID de usuario requerido'
      });
    }

    const friendRequest = await FriendRequest.findOne({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId }
      ],
      status: { $in: ['pending', 'accepted'] }
    }).sort({ createdAt: -1 });

    if (!friendRequest) {
      return res.json({
        success: true,
        data: { status: 'none' }
      });
    }

    res.json({
      success: true,
      data: {
        status: friendRequest.status,
        requestId: friendRequest._id,
        isFromCurrentUser: friendRequest.from.toString() === String(currentUserId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getFriends = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const accepted = await FriendRequest.find({
      status: 'accepted',
      $or: [{ from: currentUserId }, { to: currentUserId }]
    })
      .populate('from', 'name email profilePicture')
      .populate('to', 'name email profilePicture')
      .sort({ updatedAt: -1 });

    const friends = accepted.map((fr) => {
      const fromId = fr.from?._id != null ? String(fr.from._id) : String(fr.from);
      const other = fromId === String(currentUserId) ? fr.to : fr.from;
      return {
        _id: other._id,
        name: other.name,
        email: other.email,
        profilePicture: other.profilePicture
      };
    });

    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const currentUserId = getUserIdFromToken(req);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud de amistad no encontrada'
      });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden cancelar solicitudes pendientes'
      });
    }

    if (friendRequest.from.toString() !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        error: 'Solo puedes cancelar solicitudes que hayas enviado'
      });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    res.json({
      success: true,
      message: 'Solicitud cancelada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export {
  createFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequestStatus,
  getFriends,
  cancelFriendRequest
};