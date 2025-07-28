import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';

// logger minimale
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
  res.json = (body, ...rest: any[]) => {
    capturedJson = body;
    return (originalJson as any)(body, ...rest as any[]);
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

  // handler errori
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? err.statusCode ?? 500;
    res.status(status).json({ message: err.message ?? 'Internal Server Error' });
    throw err;
  });

  // dev → Vite HMR  |  prod → statici
  if (app.get('env') === 'development') {
    const { setupVite } = await import('./dev/vite');     // import dinamico
    await setupVite(app, server);
  } else {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const clientPath = path.resolve(__dirname, '../dist/public');
    app.use(express.static(clientPath));
    log('serving static files from', clientPath);
  }

  const port = parseInt(process.env.PORT ?? '5000', 10);
  server.listen(port, () => log(`serving on port ${port}`));
})();

// helper per i test
export async function createApp() {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: false }));
  return registerRoutes(testApp);
}
