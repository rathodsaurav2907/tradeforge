import { Pool } from 'pg';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

// In-Memory store for frictionless local development & fallback
interface InMemoryStore {
  users: Map<string, any>;
  portfolios: Map<string, any>;
  orders: Map<string, any>;
  trades: any[];
  positions: Map<string, any>; // key: `${portfolio_id}:${symbol}`
  ledger: any[];
}

export const inMemoryStore: InMemoryStore = {
  users: new Map(),
  portfolios: new Map(),
  orders: new Map(),
  trades: [],
  positions: new Map(),
  ledger: []
};

// Seed initial default demo user for paper trading out-of-the-box
const DEMO_USER_ID = 'demo-user-tradeforge';
const DEMO_PORTFOLIO_ID = 'demo-portfolio-tradeforge';

inMemoryStore.users.set(DEMO_USER_ID, {
  id: DEMO_USER_ID,
  email: 'demo@tradeforge.io',
  password_hash: '$2a$10$demoHashedPasswordPlaceholder',
  full_name: 'Alex Trader',
  created_at: new Date()
});

inMemoryStore.portfolios.set(DEMO_PORTFOLIO_ID, {
  id: DEMO_PORTFOLIO_ID,
  user_id: DEMO_USER_ID,
  account_name: 'Primary Paper Portfolio',
  cash_balance: config.defaultVirtualCash,
  currency: 'USD',
  created_at: new Date()
});

inMemoryStore.ledger.push({
  id: 'ledger-initial-deposit',
  portfolio_id: DEMO_PORTFOLIO_ID,
  entry_type: 'DEPOSIT',
  amount: config.defaultVirtualCash,
  balance_after: config.defaultVirtualCash,
  description: 'Initial virtual capital grant',
  reference_id: null,
  created_at: new Date()
});

// Seed a couple of initial holdings so the user sees real P&L on first load!
inMemoryStore.positions.set(`${DEMO_PORTFOLIO_ID}:AAPL`, {
  id: 'pos-1',
  portfolio_id: DEMO_PORTFOLIO_ID,
  symbol: 'AAPL',
  quantity: 25,
  avg_entry_price: 175.50,
  updated_at: new Date()
});

inMemoryStore.positions.set(`${DEMO_PORTFOLIO_ID}:NVDA`, {
  id: 'pos-2',
  portfolio_id: DEMO_PORTFOLIO_ID,
  symbol: 'NVDA',
  quantity: 15,
  avg_entry_price: 850.00,
  updated_at: new Date()
});

let pool: Pool | null = null;
let usePostgres = false;

export async function initDatabase(): Promise<void> {
  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 3000
    });
    
    // Test connectivity
    const client = await pool.connect();
    usePostgres = true;
    console.log('[Database] Connected successfully to PostgreSQL.');
    
    // Execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('[Database] PostgreSQL schema verified/initialized.');
    }
    client.release();
  } catch (err: any) {
    console.warn(`[Database] PostgreSQL unavailable (${err.message}). Using built-in transactional memory store.`);
    usePostgres = false;
  }
}

export function isUsingPostgres(): boolean {
  return usePostgres;
}

export function getDbPool(): Pool | null {
  return pool;
}

export { DEMO_USER_ID, DEMO_PORTFOLIO_ID };
