import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes.js';

const log = (...args: any[]) => console.log('[server]', ...args);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ────────── middleware log API ──────────
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJson: any;

  const originalJson = res.json.bind(res);
  res.json = (body: any, ..._rest: any[]) => {
    capturedJson = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    if (reqPath.startsWith('/api')) {
      const ms = Date.now() - start;
      let line = `${req.method} ${reqPath} ${res.statusCode} in ${ms}ms`;
      if (capturedJson) line += ` :: ${JSON.stringify(capturedJson)}`;
      if (line.length > 80) line = line.slice(0, 79) + '…';
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? err.statusCode ?? 500;
    res.status(status).json({ message: err.message ?? 'Internal Server Error' });
    throw err;
  });

  if (app.get('env') === 'development') {
    const { setupVite } = await import('./dev/vite.js');
    await setupVite(app, server);
  } else {
    const clientPath = path.resolve(process.cwd(), 'dist_public');
    app.use(express.static(clientPath)); // Serve i file statici (JS, CSS, immagini, ecc.)
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientPath, 'index.html'));
    });
  }

  // ✅ Fuori dal blocco if/else
  const port = parseInt(process.env.PORT ?? '5000', 10);
  server.listen(port, () => log(`serving on port ${port}`));
})();

export async function createApp() {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: false }));
  return registerRoutes(testApp);
}
