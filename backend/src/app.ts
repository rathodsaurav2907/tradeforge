import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

export function createApp(): Application {
  const app = express();

  // Standard middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'TradeForge Node.js API Gateway & Paper Engine',
      timestamp: new Date().toISOString()
    });
  });

  // API router mount
  app.use('/api', routes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Path ${req.originalUrl} not found.` });
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[API Error]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
}
