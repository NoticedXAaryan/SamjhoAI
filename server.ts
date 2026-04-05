import { createBackend } from './src/backend/index.js';
import { env } from './src/backend/config/env.js';

async function startServer() {
  const { app, httpServer } = createBackend();

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
    const { default: express } = await import('express');

    // Serve static assets first
    app.use('/', express.static(distPath));

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
}

startServer().catch((err) => {
  console.error('[Samjho] Fatal startup error:', err);
  process.exit(1);
});
