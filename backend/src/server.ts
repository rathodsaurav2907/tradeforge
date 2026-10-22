import { createApp } from './app';
import { config } from './config';
import { initDatabase } from './db/database';

async function bootstrap() {
  await initDatabase();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🚀 TradeForge Backend Engine Started`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`📚 Health: http://localhost:${config.port}/health`);
    console.log(`⚡ API Base: http://localhost:${config.port}/api`);
    console.log(`🐍 Python Analytics Target: ${config.analyticsUrl}`);
    console.log(`=========================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start TradeForge server:', err);
  process.exit(1);
});
