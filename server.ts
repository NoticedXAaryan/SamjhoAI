import { createBackend } from './src/backend/index.js';
import { env } from './src/backend/config/env.js';
import { prisma } from './src/backend/lib/prisma.js';
import { stopSocketCleanup } from './src/backend/socket/index.js';

async function connectDB() {
  await prisma.$queryRaw`SELECT 1`;
}

async function startServer() {
  const { app, httpServer, io } = createBackend();

  if (env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve Vite-built static files
    const path = await import('path');
    const distPath = path.join(process.cwd(), 'dist');
    const expressMod = await import('express');

    // Serve static assets first
    app.use('/', expressMod.default.static(distPath));

    // SPA fallback — all non-API routes return index.html
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start server immediately — health checks respond /health right away
  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[Samjho] Server running on http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  });

  // Connect to DB in background (non-blocking)
  connectDB()
    .then(() => {
      console.log('[Samjho] Database connected successfully');
    })
    .catch((err) => {
      console.error('[Samjho] Database unavailable — check DATABASE_URL env var');
      console.error('[Samjho] Details:', err.message);
      if (env.NODE_ENV === 'production') {
        // Don't crash the process — the server can still serve static files and show errors
        console.log('[Samjho] Server is running, but API routes will fail until DB connects');
      }
    });

  // ── Graceful shutdown ───────────────────────────────────────────────
  async function shutdownSignal() {
    console.log('[Samjho] Shutting down gracefully...');
    httpServer.close(async () => {
      // Clean up socket rate-limit interval
      stopSocketCleanup();
      // Close all Socket.IO connections
      io.close(() => console.log('[Samjho] Socket.IO closed'));
      // Disconnect Prisma
      await prisma.$disconnect();
      console.log('[Samjho] Disconnected from database');
      process.exit(0);
    });
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Samjho] Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', shutdownSignal);
  process.on('SIGINT', shutdownSignal);
}

startServer().catch((err) => {
  console.error('[Samjho] Fatal startup error:', err);
  process.exit(1);
});
