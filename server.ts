import { createBackend } from './src/backend/index.js';
import { env } from './src/backend/config/env.js';
import { prisma } from './src/backend/lib/prisma.js';

async function waitForDB(maxRetries = 10, delayMs = 3000) {
  if (env.NODE_ENV === 'production') {
    console.log('[Samjho] Waiting for database connection...');
    for (let i = 0; i < maxRetries; i++) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log('[Samjho] Database connected successfully');
        return;
      } catch (err) {
        if (i === maxRetries - 1) {
          console.error('[Samjho] Database connection failed after', maxRetries, 'retries');
          throw err;
        }
        console.log(`[Samjho] Database not ready (attempt ${i + 1}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
}

async function startServer() {
  await waitForDB();
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

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[Samjho] Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // ── Graceful shutdown ───────────────────────────────────────────────
  async function shutdownSignal() {
    console.log('[Samjho] Shutting down gracefully...');
    httpServer.close(async () => {
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
