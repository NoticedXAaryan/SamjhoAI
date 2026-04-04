import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

// In-memory store for meetings
const meetings = new Map<string, any>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post('/api/meetings', (req, res) => {
    const { id, title, date, time } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Meeting ID required' });
    }
    meetings.set(id, { id, title, date, time, participants: [] });
    res.json({ success: true, meeting: meetings.get(id) });
  });

  app.get('/api/meetings/:id', (req, res) => {
    const meeting = meetings.get(req.params.id);
    if (meeting) {
      res.json(meeting);
    } else {
      res.status(404).json({ error: 'Meeting not found' });
    }
  });

  // Socket.io logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (meetingId, userDetails) => {
      socket.join(meetingId);
      console.log(`User ${userDetails.name} (${socket.id}) joined room ${meetingId}`);
      
      // Store user info in socket
      socket.data.meetingId = meetingId;
      socket.data.user = { id: socket.id, ...userDetails };

      // Notify others in the room
      socket.to(meetingId).emit('user-connected', socket.data.user);

      // Send the current list of participants to the new user
      const clients = io.sockets.adapter.rooms.get(meetingId);
      if (clients) {
        const participants = Array.from(clients)
          .filter(id => id !== socket.id)
          .map(id => io.sockets.sockets.get(id)?.data.user)
          .filter(Boolean);
        socket.emit('existing-participants', participants);
      }
    });

    socket.on('state-change', (meetingId, state) => {
      socket.data.user = { ...socket.data.user, ...state };
      socket.to(meetingId).emit('user-state-changed', { id: socket.id, ...state });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      if (socket.data.meetingId) {
        socket.to(socket.data.meetingId).emit('user-disconnected', socket.id);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
