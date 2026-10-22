import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'tradeforge_jwt_super_secret_key_2026',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tradeforge',
  analyticsUrl: process.env.ANALYTICS_URL || 'http://localhost:8000',
  defaultVirtualCash: 100000.0, // $100k starting virtual cash
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
