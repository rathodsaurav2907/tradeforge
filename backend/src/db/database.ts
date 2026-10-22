import { Pool } from 'pg';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

export interface WatchlistRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  userId: string;
  orderId?: string;
  symbol: string;
  tradeType: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  setupTag: string; // e.g. "Support Bounce", "Breakout", "Earnings"
  notes: string;
  emotionalState: 'DISCIPLINED' | 'PATIENT' | 'ANXIOUS' | 'FOMO';
  rating: number; // 1 to 5 stars
  pnl?: number;
  createdAt: Date;
}

// In-Memory store
interface InMemoryStore {
  users: Map<string, any>;
  portfolios: Map<string, any>;
  orders: Map<string, any>;
  trades: any[];
  positions: Map<string, any>;
  ledger: any[];
  watchlists: Map<string, WatchlistRecord>;
  journal: JournalEntry[];
}

export const inMemoryStore: InMemoryStore = {
  users: new Map(),
  portfolios: new Map(),
  orders: new Map(),
  trades: [],
  positions: new Map(),
  ledger: [],
  watchlists: new Map(),
  journal: []
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
  account_name: 'Primary INR Paper Portfolio',
  cash_balance: config.defaultVirtualCash,
  currency: 'INR',
  currency_symbol: '₹',
  created_at: new Date()
});

inMemoryStore.ledger.push({
  id: 'ledger-initial-deposit',
  portfolio_id: DEMO_PORTFOLIO_ID,
  entry_type: 'DEPOSIT',
  amount: config.defaultVirtualCash,
  balance_after: config.defaultVirtualCash,
  description: 'Initial virtual capital grant (₹10,00,000 INR)',
  reference_id: null,
  created_at: new Date()
});

// Seed initial holdings in Indian Equities (₹)
inMemoryStore.positions.set(`${DEMO_PORTFOLIO_ID}:RELIANCE`, {
  id: 'pos-1',
  portfolio_id: DEMO_PORTFOLIO_ID,
  symbol: 'RELIANCE',
  quantity: 50,
  avg_entry_price: 2900.00,
  updated_at: new Date()
});

inMemoryStore.positions.set(`${DEMO_PORTFOLIO_ID}:TCS`, {
  id: 'pos-2',
  portfolio_id: DEMO_PORTFOLIO_ID,
  symbol: 'TCS',
  quantity: 30,
  avg_entry_price: 3800.00,
  updated_at: new Date()
});

// Seed default customizable watchlists
inMemoryStore.watchlists.set('wl-1', {
  id: 'wl-1',
  userId: DEMO_USER_ID,
  name: 'Nifty Bluechips',
  description: 'Core large-cap momentum leaders',
  symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'],
  createdAt: new Date(),
  updatedAt: new Date()
});

inMemoryStore.watchlists.set('wl-2', {
  id: 'wl-2',
  userId: DEMO_USER_ID,
  name: 'Auto & Banking',
  description: 'High-beta domestic growth leaders',
  symbols: ['TATAMOTORS', 'SBIN', 'ICICIBANK'],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Seed sample trading journal entry
inMemoryStore.journal.push({
  id: 'jr-1',
  userId: DEMO_USER_ID,
  symbol: 'RELIANCE',
  tradeType: 'BUY',
  entryPrice: 2900.00,
  quantity: 50,
  setupTag: 'Support Bounce',
  notes: 'Bought near 50-period SMA support level after oversold RSI confirmation.',
  emotionalState: 'DISCIPLINED',
  rating: 5,
  pnl: 2520.00,
  createdAt: new Date()
});

let pool: Pool | null = null;
let usePostgres = false;

export async function initDatabase(): Promise<void> {
  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      connectionTimeoutMillis: 3000
    });
    
    const client = await pool.connect();
    usePostgres = true;
    console.log('[Database] Connected successfully to PostgreSQL.');
    
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
