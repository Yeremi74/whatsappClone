import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { field, value } = req.query;

    if (!field) {
      return res.status(400).json({
        success: false,
        error: 'El campo (field) y el valor (value) son requeridos'
      });
    }

    // Campos permitidos para búsqueda
    const allowedFields = ['name', 'email', 'description'];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        error: `Campo no válido. Campos permitidos: ${allowedFields.join(', ')}`
      });
    }

    // Extraer el token del header Authorization
    let currentUserId = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (error) {
        // Si el token es inválido, continuamos sin excluir usuario
        // (opcional: puedes retornar error si quieres que sea obligatorio)
      }
    }

    // Construir la consulta con regex case-insensitive
    const query = { [field]: { $regex: value, $options: 'i' } };
    
    // Excluir al usuario actual si hay token válido
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }
    
    const users = await User.find(query).select('-password');

    if (users.length === 0) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'search.noUsersFound',
        messageKey: 'search.noUsersFound'
      });
    }

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y email son requeridos'
      });
    }

    const user = new User({ name, email });
    await user.save();

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación requerido'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const { name, email, description, profilePicture } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (description !== undefined) updateData.description = description;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};


const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export { getUsers, getUserById, getCurrentUser, searchUsers, createUser, updateUser, updateCurrentUser, deleteUser }