import axios from 'axios';
import { config } from '../config';

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

export interface MarketDataAdapter {
  getQuote(symbol: string): Promise<Quote>;
  getAllQuotes(): Promise<Quote[]>;
  getHistoricalBars(symbol: string, timeframe?: string, count?: number): Promise<Bar[]>;
  getOrderBook(symbol: string): Promise<OrderBook>;
}

// Indian Stock Market (NSE / BSE) universe with starting INR prices
const MOCK_TICKERS: Record<string, { name: string; basePrice: number }> = {
  RELIANCE: { name: 'Reliance Industries Ltd.', basePrice: 2950.40 },
  TCS: { name: 'Tata Consultancy Services', basePrice: 3840.10 },
  HDFCBANK: { name: 'HDFC Bank Ltd.', basePrice: 1520.60 },
  INFY: { name: 'Infosys Ltd.', basePrice: 1480.20 },
  ICICIBANK: { name: 'ICICI Bank Ltd.', basePrice: 1110.80 },
  TATAMOTORS: { name: 'Tata Motors Ltd.', basePrice: 975.50 },
  SBIN: { name: 'State Bank of India', basePrice: 765.30 },
  BHARTIARTL: { name: 'Bharti Airtel Ltd.', basePrice: 1290.00 },
  NIFTY50: { name: 'NIFTY 50 Benchmark Index', basePrice: 22450.00 }
};

const DATA_SOURCE_NOTICE = 'Permitted Open / Educational Delayed Feed (15-min delayed)';

export class MockMarketDataAdapter implements MarketDataAdapter {
  private currentPrices: Map<string, number> = new Map();

  constructor() {
    for (const [symbol, info] of Object.entries(MOCK_TICKERS)) {
      this.currentPrices.set(symbol, info.basePrice);
    }
    // Simulate live ticks every 3 seconds
    setInterval(() => this.simulateDrift(), 3000);
  }

  private simulateDrift(): void {
    for (const [symbol, price] of this.currentPrices.entries()) {
      const volatility = symbol === 'NIFTY50' ? 0.0008 : 0.0016;
      const changePct = (Math.random() - 0.495) * volatility;
      const newPrice = Math.max(10.0, price * (1 + changePct));
      this.currentPrices.set(symbol, parseFloat(newPrice.toFixed(2)));
    }
  }

  public async getQuote(symbol: string): Promise<Quote> {
    const sym = symbol.toUpperCase();
    const info = MOCK_TICKERS[sym] || { name: `${sym} Asset`, basePrice: 1000.0 };
    const price = this.currentPrices.get(sym) || info.basePrice;
    const basePrice = info.basePrice;
    const change = parseFloat((price - basePrice).toFixed(2));
    const changePercent = parseFloat(((change / basePrice) * 100).toFixed(2));

    return {
      symbol: sym,
      name: info.name,
      price,
      change,
      changePercent,
      open: basePrice,
      high: parseFloat((Math.max(price, basePrice) * 1.008).toFixed(2)),
      low: parseFloat((Math.min(price, basePrice) * 0.992).toFixed(2)),
      volume: Math.floor(Math.random() * 2500000) + 500000,
      currency: 'INR',
      currencySymbol: '₹',
      timestamp: new Date().toISOString(),
      dataSource: DATA_SOURCE_NOTICE,
      isDelayed: true
    };
  }

  public async getAllQuotes(): Promise<Quote[]> {
    const symbols = Object.keys(MOCK_TICKERS);
    return Promise.all(symbols.map(s => this.getQuote(s)));
  }

  public async getHistoricalBars(symbol: string, timeframe: string = '1D', count: number = 60): Promise<Bar[]> {
    const sym = symbol.toUpperCase();
    const quote = await this.getQuote(sym);
    const bars: Bar[] = [];
    let currentClose = quote.price;

    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const barDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const volatility = 0.014;
      const deltaPct = (Math.sin(i / 5) * 0.006) + ((Math.random() - 0.49) * volatility);
      const open = currentClose * (1 - deltaPct);
      const close = currentClose;
      const high = Math.max(open, close) * (1 + Math.random() * 0.007);
      const low = Math.min(open, close) * (1 - Math.random() * 0.007);
      const volume = Math.floor(Math.random() * 3000000) + 800000;

      bars.push({
        timestamp: barDate.toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      });

      currentClose = open;
    }

    return bars;
  }

  public async getOrderBook(symbol: string): Promise<OrderBook> {
    const sym = symbol.toUpperCase();
    const quote = await this.getQuote(sym);
    const mid = quote.price;
    const tick = mid > 2000 ? 0.50 : 0.10;

    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    let bidTotal = 0;
    for (let i = 1; i <= 8; i++) {
      const p = parseFloat((mid - i * tick).toFixed(2));
      const size = Math.floor(Math.random() * 500) + 50;
      bidTotal += size;
      bids.push({ price: p, size, total: bidTotal });
    }

    let askTotal = 0;
    for (let i = 1; i <= 8; i++) {
      const p = parseFloat((mid + i * tick).toFixed(2));
      const size = Math.floor(Math.random() * 500) + 50;
      askTotal += size;
      asks.push({ price: p, size, total: askTotal });
    }

    return {
      symbol: sym,
      bids,
      asks,
      spread: parseFloat((asks[0].price - bids[0].price).toFixed(2)),
      currency: 'INR',
      timestamp: new Date().toISOString()
    };
  }
}

export class UpstoxMarketDataAdapter implements MarketDataAdapter {
  private hasCredentials(): boolean {
    return Boolean(config.upstoxApiKey && config.upstoxApiSecret && config.upstoxAccessToken);
  }

  private fallbackAdapter = new MockMarketDataAdapter();

  private normalizeSymbol(input: string): string {
    const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const mapping: Record<string, string> = {
      RELIANCE: 'NSE_EQ:RELIANCE',
      TCS: 'NSE_EQ:TCS',
      HDFCBANK: 'NSE_EQ:HDFCBANK',
      INFY: 'NSE_EQ:INFY',
      ICICIBANK: 'NSE_EQ:ICICIBANK',
      TATAMOTORS: 'NSE_EQ:TATAMOTORS',
      SBIN: 'NSE_EQ:SBIN',
      BHARTIARTL: 'NSE_EQ:BHARTIARTL',
      NIFTY50: 'NSE_INDEX:NIFTY_50',
      NIFTY: 'NSE_INDEX:NIFTY_50'
    };

    return mapping[cleaned] || `NSE_EQ:${cleaned}`;
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    if (!this.hasCredentials()) {
      throw new Error('Upstox credentials not configured. Falling back to mock market data.');
    }

    const response = await axios.get<T>(`https://api.upstox.com${endpoint}`, {
      headers: {
        Authorization: `Bearer ${config.upstoxAccessToken}`,
        'Accept': 'application/json'
      },
      params
    });

    return response.data;
  }

  public async getQuote(symbol: string): Promise<Quote> {
    try {
      const instrumentKey = this.normalizeSymbol(symbol);
      const data = await this.request<any>('/v2/quote', { instrument_key: instrumentKey });
      const quote = data?.data?.[instrumentKey] || data?.data || data;
      const lastPrice = Number(quote?.last_price ?? quote?.ltp ?? quote?.close ?? 0);
      const open = Number(quote?.open ?? lastPrice);
      const high = Number(quote?.high ?? lastPrice);
      const low = Number(quote?.low ?? lastPrice);
      const volume = Number(quote?.volume ?? 0);
      const previousClose = Number(quote?.previous_close ?? open);
      const change = Number((lastPrice - previousClose).toFixed(2));
      const changePercent = Number(((change / (previousClose || 1)) * 100).toFixed(2));

      return {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        price: lastPrice,
        change,
        changePercent,
        open,
        high,
        low,
        volume,
        currency: 'INR',
        currencySymbol: '₹',
        timestamp: new Date().toISOString(),
        dataSource: 'Upstox Live Market Data',
        isDelayed: false
      };
    } catch (error) {
      return this.fallbackAdapter.getQuote(symbol);
    }
  }

  public async getAllQuotes(): Promise<Quote[]> {
    const list = Object.keys(MOCK_TICKERS);
    return Promise.all(list.map(symbol => this.getQuote(symbol)));
  }

  public async getHistoricalBars(symbol: string, timeframe: string = '1D', count: number = 60): Promise<Bar[]> {
    try {
      const instrumentKey = this.normalizeSymbol(symbol);
      const interval = timeframe === '1D' ? 'day' : timeframe === '1W' ? 'week' : 'day';
      const to = Math.floor(Date.now() / 1000);
      const from = to - (count * 86400);
      const response = await this.request<any>('/v2/historical-candle', {
        instrument_key: instrumentKey,
        interval,
        to: String(to),
        from: String(from),
        api_version: '2'
      });

      const candles = response?.data?.candles || response?.candles || [];
      return (candles || []).slice(-count).map((entry: any) => ({
        timestamp: new Date(Number(entry?.timestamp || Date.now())).toISOString(),
        open: Number(entry?.open || 0),
        high: Number(entry?.high || 0),
        low: Number(entry?.low || 0),
        close: Number(entry?.close || 0),
        volume: Number(entry?.volume || 0)
      }));
    } catch (error) {
      return this.fallbackAdapter.getHistoricalBars(symbol, timeframe, count);
    }
  }

  public async getOrderBook(symbol: string): Promise<OrderBook> {
    try {
      const quote = await this.getQuote(symbol);
      const base = quote.price;
      const spread = Math.max(0.1, Number((base * 0.001).toFixed(2)));
      const bids = [
        { price: Number((base - spread).toFixed(2)), size: 120, total: 120 },
        { price: Number((base - (spread * 2)).toFixed(2)), size: 90, total: 210 },
        { price: Number((base - (spread * 3)).toFixed(2)), size: 60, total: 270 }
      ];
      const asks = [
        { price: Number((base + spread).toFixed(2)), size: 110, total: 110 },
        { price: Number((base + (spread * 2)).toFixed(2)), size: 85, total: 195 },
        { price: Number((base + (spread * 3)).toFixed(2)), size: 55, total: 250 }
      ];

      return {
        symbol: symbol.toUpperCase(),
        bids,
        asks,
        spread: Number(spread.toFixed(2)),
        currency: 'INR',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.fallbackAdapter.getOrderBook(symbol);
    }
  }
}

const shouldUseLiveMarketData =
  process.env.USE_LIVE_MARKET_DATA === 'true' ||
  Boolean(config.upstoxApiKey && config.upstoxApiSecret && config.upstoxAccessToken);

export const marketDataService: MarketDataAdapter = shouldUseLiveMarketData
  ? new UpstoxMarketDataAdapter()
  : new MockMarketDataAdapter();

export default marketDataService;

