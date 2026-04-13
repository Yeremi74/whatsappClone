import express from 'express';
import {
  getUsers,
  getUserById,
  getCurrentUser,
  searchUsers,
  createUser,
  updateUser,
  updateCurrentUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// Rutas de usuarios
router.get('/', getUsers);
router.get('/me', getCurrentUser); // Obtener usuario actual
router.get('/search', searchUsers); // Debe ir antes de /:id
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/me', updateCurrentUser); // Actualizar usuario actual
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
