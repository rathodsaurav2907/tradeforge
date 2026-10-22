import axios from 'axios';

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
const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com';

const normalizeTicker = (symbol: string): string => {
  const normalized = symbol.trim().toUpperCase();
  if (!normalized) {
    return 'RELIANCE.NS';
  }

  if (normalized.includes('.')) return normalized;
  if (normalized === 'NIFTY50') return '^NSEI';
  return `${normalized}.NS`;
};

const safeNumber = (value: number | undefined | null): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

export class MockMarketDataAdapter implements MarketDataAdapter {
  private currentPrices: Map<string, number> = new Map();

  constructor() {
    for (const [symbol, info] of Object.entries(MOCK_TICKERS)) {
      this.currentPrices.set(symbol, info.basePrice);
    }
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

const buildSyntheticOrderBook = (symbol: string, price: number): OrderBook => {
  const mid = safeNumber(price) || 1000;
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
    symbol: symbol.toUpperCase(),
    bids,
    asks,
    spread: parseFloat((asks[0].price - bids[0].price).toFixed(2)),
    currency: 'INR',
    timestamp: new Date().toISOString()
  };
};

const parseYahooQuote = (payload: any): Quote | null => {
  const result = payload?.quoteResponse?.result?.[0];
  if (!result) return null;

  const symbol = (result.symbol || 'UNKNOWN').toUpperCase();
  const price = safeNumber(result.regularMarketPrice);
  const open = safeNumber(result.regularMarketOpen);
  const high = safeNumber(result.regularMarketDayHigh);
  const low = safeNumber(result.regularMarketDayLow);
  const volume = safeNumber(result.regularMarketVolume);
  const change = safeNumber(result.regularMarketChange);
  const changePercent = safeNumber(result.regularMarketChangePercent);
  const previousClose = safeNumber(result.regularMarketPreviousClose) || price;

  return {
    symbol,
    name: result.shortName || symbol,
    price: price || previousClose,
    change: change || (price - previousClose),
    changePercent: changePercent || ((price - previousClose) / Math.max(previousClose, 1)) * 100,
    open: open || previousClose,
    high: high || price,
    low: low || price,
    volume: volume || 0,
    currency: result.currency || 'INR',
    currencySymbol: result.currency === 'INR' ? '₹' : '$',
    timestamp: new Date().toISOString(),
    dataSource: 'Yahoo Finance (live)',
    isDelayed: false
  };
};

const parseYahooBars = (payload: any): Bar[] => {
  const result = payload?.chart?.result?.[0];
  if (!result?.timestamp || !result?.indicators?.quote?.[0]) return [];

  const timestamps = result.timestamp || [];
  const quote = result.indicators.quote[0];
  const opens = quote.open || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const closes = quote.close || [];
  const volumes = quote.volume || [];

  return timestamps.map((ts: number, index: number) => ({
    timestamp: new Date(ts * 1000).toISOString(),
    open: safeNumber(opens[index]) || 0,
    high: safeNumber(highs[index]) || 0,
    low: safeNumber(lows[index]) || 0,
    close: safeNumber(closes[index]) || 0,
    volume: safeNumber(volumes[index]) || 0
  })).filter((bar: Bar) => bar.close > 0);
};

export class RealMarketDataAdapter implements MarketDataAdapter {
  private readonly fallbackAdapter = new MockMarketDataAdapter();

  private async fetchQuoteFromYahoo(symbol: string): Promise<Quote | null> {
    try {
      const yahooSymbol = normalizeTicker(symbol);
      const response = await axios.get(`${YAHOO_BASE_URL}/v6/finance/quote`, {
        params: {
          symbols: yahooSymbol
        },
        timeout: 6000
      });

      const quote = parseYahooQuote(response.data);
      return quote;
    } catch (error) {
      return null;
    }
  }

  private async fetchHistoricalBarsFromYahoo(symbol: string, timeframe?: string, count?: number): Promise<Bar[]> {
    try {
      const normalizedSymbol = normalizeTicker(symbol);
      const range = timeframe === '1D' ? '1mo' : '1mo';
      const interval = timeframe === '1D' ? '1d' : '1d';

      const response = await axios.get(`${YAHOO_BASE_URL}/v8/finance/chart/${normalizedSymbol}`, {
        params: {
          range,
          interval,
          includeAdjustedClose: true
        },
        timeout: 6000
      });

      const bars = parseYahooBars(response.data);
      if (bars.length === 0) return [];
      return bars.slice(-Math.max(count || 60, 10));
    } catch (error) {
      return [];
    }
  }

  public async getQuote(symbol: string): Promise<Quote> {
    const formattedSymbol = (symbol || 'RELIANCE').trim().toUpperCase();
    const quote = await this.fetchQuoteFromYahoo(formattedSymbol);
    if (quote) return quote;
    return this.fallbackAdapter.getQuote(formattedSymbol);
  }

  public async getAllQuotes(): Promise<Quote[]> {
    const symbols = Object.keys(MOCK_TICKERS);
    const results = await Promise.all(symbols.map(symbol => this.getQuote(symbol)));
    return results.filter((quote): quote is Quote => Boolean(quote));
  }

  public async getHistoricalBars(symbol: string, timeframe: string = '1D', count: number = 60): Promise<Bar[]> {
    const bars = await this.fetchHistoricalBarsFromYahoo(symbol, timeframe, count);
    if (bars.length > 0) return bars;
    return this.fallbackAdapter.getHistoricalBars(symbol, timeframe, count);
  }

  public async getOrderBook(symbol: string): Promise<OrderBook> {
    const quote = await this.getQuote(symbol);
    return buildSyntheticOrderBook(quote.symbol, quote.price);
  }
}

export const marketDataService: MarketDataAdapter = new RealMarketDataAdapter();
