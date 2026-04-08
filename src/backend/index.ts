import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { prisma } from './lib/prisma.js';
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

  // ── Security middleware ────────────────────────────────────────────────────
  const isProd = env.NODE_ENV === 'production';

  app.use(helmet(isProd ? {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind v4 runtime requires this
        imgSrc: ["'self'", 'data:', 'blob:', 'https://storage.googleapis.com', 'https://cdn.jsdelivr.net', 'https://images.unsplash.com'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https://storage.googleapis.com', 'https://cdn.jsdelivr.net'],
        mediaSrc: ["'self'", 'blob:', 'mediastream:'],
        workerSrc: ["'self'", 'blob:'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  } : { contentSecurityPolicy: false }));

  app.use(compression());
  app.use(cookieParser());
  app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // ── Health checks ────────────────────────────────────────────────────────
  // Liveness probe: always returns 200 so the process stays alive
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Readiness probe: checks DB connectivity — returns 503 if down
  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
    }
  });

  // ── WebRTC ICE config (returns TURN credentials if configured) ─────────────
  app.get('/api/webrtc/ice-config', (_req, res) => {
    res.json({
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        ...(env.TURN_URL
          ? [{ urls: env.TURN_URL, username: env.TURN_USER ?? '', credential: env.TURN_PASS ?? '' }]
          : []),
      ],
    });
  });

  // ── API Routes ─────────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/meetings', meetingsRouter);

  // ── 404 catch-all for API ──────────────────────────────────────────────────
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // ── Global error handler (prevents crash on unhandled errors) ──────────────
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Express] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, httpServer, io };
}
