import axios from 'axios';

const API_BASE = '/api';

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  currency: string;
  currencySymbol: string;
  timestamp: string;
  dataSource: string;
  isDelayed: boolean;
}

export interface Bar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20?: number;
  sma_50?: number;
  ema_9?: number;
  ema_21?: number;
  rsi_14?: number;
  macd_line?: number;
  macd_signal?: number;
  macd_hist?: number;
  bb_upper?: number;
  bb_lower?: number;
  atr_14?: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  currency: string;
  timestamp: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  currency: string;
  currencySymbol: string;
}

export interface PortfolioSummary {
  portfolioId: string;
  currency: string;
  currencySymbol: string;
  cashBalance: number;
  holdingsMarketValue: number;
  totalEquity: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dayPnL: number;
  dayPnLPercent: number;
  positions: Position[];
  isSimulated: boolean;
  disclaimer: string;
}

export interface OrderRecord {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  quantity: number;
  filled_quantity: number;
  price: number;
  avg_fill_price: number | null;
  total_cost: number | null;
  currency: string;
  currency_symbol: string;
  is_simulated: boolean;
  created_at: string;
}

export interface AISignals {
  ticker: string;
  action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentum_score: number;
  volatility_score: number;
  current_price: number;
  support_level: number;
  resistance_level: number;
  stop_loss_suggested: number;
  take_profit_suggested: number;
  risk_reward_ratio: number;
  reasons: string[];
}

export interface LedgerEntry {
  id: string;
  entry_type: string;
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface WatchlistRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  symbols: string[];
  createdAt: string;
  updatedAt: string;
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
  setupTag: string;
  notes: string;
  emotionalState: 'DISCIPLINED' | 'PATIENT' | 'ANXIOUS' | 'FOMO';
  rating: number;
  pnl?: number;
  createdAt: string;
}

export interface JournalStats {
  totalLogged: number;
  winRate: number;
  averageRating: number;
  disciplineScore: number;
  topSetup: string;
}

// Indian Currency (INR) Number Formatter
export function formatINR(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0.00';
  const isNeg = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${isNeg ? '-' : ''}₹${formatted}`;
}

export const api = {
  // Market
  getQuotes: async (): Promise<Quote[]> => {
    const res = await axios.get(`${API_BASE}/market/quotes`);
    return res.data;
  },
  getQuote: async (symbol: string): Promise<Quote> => {
    const res = await axios.get(`${API_BASE}/market/quotes/${symbol}`);
    return res.data;
  },
  getBars: async (symbol: string, count: number = 60): Promise<Bar[]> => {
    const res = await axios.get(`${API_BASE}/market/bars/${symbol}?count=${count}`);
    return res.data;
  },
  getOrderBook: async (symbol: string): Promise<OrderBook> => {
    const res = await axios.get(`${API_BASE}/market/orderbook/${symbol}`);
    return res.data;
  },

  // Orders
  placeOrder: async (data: {
    symbol: string;
    side: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
    quantity: number;
    price?: number;
  }) => {
    const res = await axios.post(`${API_BASE}/orders`, data);
    return res.data;
  },
  getOrders: async (): Promise<OrderRecord[]> => {
    const res = await axios.get(`${API_BASE}/orders`);
    return res.data;
  },
  cancelOrder: async (orderId: string) => {
    const res = await axios.delete(`${API_BASE}/orders/${orderId}`);
    return res.data;
  },

  // Portfolio & Ledger
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    const res = await axios.get(`${API_BASE}/portfolio/summary`);
    return res.data;
  },
  getLedger: async (): Promise<LedgerEntry[]> => {
    const res = await axios.get(`${API_BASE}/portfolio/ledger`);
    return res.data;
  },

  // Python Analytics & AI
  getAISignals: async (symbol: string): Promise<AISignals> => {
    const res = await axios.get(`${API_BASE}/analytics/signals/${symbol}`);
    return res.data;
  },
  getIndicators: async (symbol: string): Promise<{ count: number; bars: Bar[] }> => {
    const res = await axios.get(`${API_BASE}/analytics/indicators/${symbol}`);
    return res.data;
  },
  getPortfolioRisk: async () => {
    const res = await axios.get(`${API_BASE}/analytics/portfolio-risk`);
    return res.data;
  },

  // Custom User Watchlists
  getWatchlists: async (): Promise<WatchlistRecord[]> => {
    const res = await axios.get(`${API_BASE}/watchlists`);
    return res.data;
  },
  createWatchlist: async (data: { name: string; description?: string; symbols?: string[] }): Promise<WatchlistRecord> => {
    const res = await axios.post(`${API_BASE}/watchlists`, data);
    return res.data;
  },
  addSymbolToWatchlist: async (watchlistId: string, symbol: string): Promise<WatchlistRecord> => {
    const res = await axios.post(`${API_BASE}/watchlists/${watchlistId}/symbols`, { symbol });
    return res.data;
  },
  removeSymbolFromWatchlist: async (watchlistId: string, symbol: string): Promise<WatchlistRecord> => {
    const res = await axios.delete(`${API_BASE}/watchlists/${watchlistId}/symbols/${symbol}`);
    return res.data;
  },
  deleteWatchlist: async (watchlistId: string) => {
    const res = await axios.delete(`${API_BASE}/watchlists/${watchlistId}`);
    return res.data;
  },

  // Trading Journal
  getJournalEntries: async (): Promise<JournalEntry[]> => {
    const res = await axios.get(`${API_BASE}/journal`);
    return res.data;
  },
  createJournalEntry: async (data: Partial<JournalEntry>): Promise<JournalEntry> => {
    const res = await axios.post(`${API_BASE}/journal`, data);
    return res.data;
  },
  getJournalStats: async (): Promise<JournalStats> => {
    const res = await axios.get(`${API_BASE}/journal/stats`);
    return res.data;
  },
  deleteJournalEntry: async (id: string) => {
    const res = await axios.delete(`${API_BASE}/journal/${id}`);
    return res.data;
  }
};
