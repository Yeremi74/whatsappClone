import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

dotenv.config();

import userRoutes from './routers/userRoutes.js';
import authRoutes from './routers/authRoutes.js';
import friendRequestRoutes from './routers/friendRequest.js';
import conversationRoutes from './routers/conversationRoutes.js';
import { setupChatSocket } from './socket/chatSocket.js';
import { registerIo } from './socket/socketBus.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true
  },
  maxHttpBufferSize: 1e7
});

registerIo(io);
setupChatSocket(io);

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-clone';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB exitosamente');
  })
  .catch((error) => {
    console.error('❌ Error al conectar a MongoDB:', error);
  });

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/friend-requests', friendRequestRoutes);
app.use('/api/conversations', conversationRoutes);
// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando correctamente!',
    timestamp: new Date().toISOString()
  });
});

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});
