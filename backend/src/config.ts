import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'tradeforge_jwt_access_secret_key_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'tradeforge_jwt_refresh_secret_key_2026',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tradeforge',
  analyticsUrl: process.env.ANALYTICS_URL || 'http://localhost:8000',
  defaultVirtualCash: 100000.0, // $100k starting virtual cash
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
