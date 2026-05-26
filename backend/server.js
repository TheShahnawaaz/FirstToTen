import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import gameManager from './gameManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    mode: 'in-memory-simplified'
  });
});

// Socket.io Real-time events
io.on('connection', (socket) => {
  console.log(`🔌 New client socket connected: ${socket.id}`);

  // Simplified Anonymous Login
  socket.on('login', (data) => {
    // data: { name, picture }
    try {
      if (!data || !data.name || !data.name.trim()) {
        throw new Error('Name is required.');
      }

      const userRecord = {
        id: Math.floor(Math.random() * 900000) + 100000,
        name: data.name.trim(),
        picture: data.picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${data.name.trim()}`
      };

      // Save user to socket session context
      socket.user = userRecord;
      console.log(`👤 User Joined: ${userRecord.name} (Temp ID: ${userRecord.id})`);
      socket.emit('login_success', userRecord);

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      socket.emit('login_error', { message: error.message });
    }
  });

  // Matchmaking Queue
  socket.on('join_queue', () => {
    if (!socket.user) {
      return socket.emit('game_error', { message: 'Must provide a name to join matchmaking.' });
    }

    const player = {
      id: socket.user.id,
      socket: socket,
      profile: {
        id: socket.user.id,
        name: socket.user.name,
        picture: socket.user.picture
      }
    };

    gameManager.addToQueue(player);
  });

  socket.on('leave_queue', () => {
    gameManager.removeFromQueue(socket.id);
  });

  // Typing status broadcast
  socket.on('typing_status', (data) => {
    const room = gameManager.findRoomByPlayerSocketId(socket.id);
    if (room) {
      const opponent = room.players.find(p => p.socket.id !== socket.id);
      if (opponent) {
        opponent.socket.emit('opponent_typing', { isTyping: data.isTyping });
      }
    }
  });

  // Client disconnecting
  socket.on('disconnect', () => {
    console.log(`🔌 Client socket disconnected: ${socket.id}`);
    gameManager.handleDisconnect(socket.id);
  });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Duel math game server running on port ${PORT}`);
});
