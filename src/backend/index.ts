import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRouter from './routes/auth.js';
import meetingsRouter from './routes/meetings.js';
import { registerSocketHandlers } from './socket/index.js';

export function createBackend() {
  const app = express();
  const httpServer = createServer(app);

  // ── Socket.io ──────────────────────────────────────────────────────────────
  const io = new Server(httpServer, {
    cors: {
      origin: env.APP_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  registerSocketHandlers(io);

  // ── Middleware ─────────────────────────────────────────────────────────────
  app.use(helmet({ contentSecurityPolicy: false })); // CSP managed by Vite in dev
  app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── Health check (for UptimeRobot keep-alive) ──────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API Routes ─────────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/meetings', meetingsRouter);

  // ── 404 catch-all for API ──────────────────────────────────────────────────
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return { app, httpServer, io };
}
