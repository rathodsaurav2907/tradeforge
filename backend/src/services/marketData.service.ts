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
  timestamp: string;
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
  timestamp: string;
}

export interface MarketDataAdapter {
  getQuote(symbol: string): Promise<Quote>;
  getAllQuotes(): Promise<Quote[]>;
  getHistoricalBars(symbol: string, timeframe?: string, count?: number): Promise<Bar[]>;
  getOrderBook(symbol: string): Promise<OrderBook>;
}

// Initial mock market data universe
const MOCK_TICKERS: Record<string, { name: string; basePrice: number }> = {
  AAPL: { name: 'Apple Inc.', basePrice: 182.40 },
  TSLA: { name: 'Tesla Inc.', basePrice: 215.80 },
  NVDA: { name: 'NVIDIA Corp.', basePrice: 890.50 },
  MSFT: { name: 'Microsoft Corp.', basePrice: 425.10 },
  AMZN: { name: 'Amazon.com Inc.', basePrice: 185.30 },
  GOOGL: { name: 'Alphabet Inc.', basePrice: 168.90 },
  SPY: { name: 'SPDR S&P 500 ETF', basePrice: 512.40 },
  'BTC-USD': { name: 'Bitcoin / USD', basePrice: 66450.00 },
  'ETH-USD': { name: 'Ethereum / USD', basePrice: 3420.00 }
};

export class MockMarketDataAdapter implements MarketDataAdapter {
  private currentPrices: Map<string, number> = new Map();

  constructor() {
    for (const [symbol, info] of Object.entries(MOCK_TICKERS)) {
      this.currentPrices.set(symbol, info.basePrice);
    }
    // Simulate real-time drift every 3 seconds
    setInterval(() => this.simulateDrift(), 3000);
  }

  private simulateDrift(): void {
    for (const [symbol, price] of this.currentPrices.entries()) {
      const volatility = symbol.includes('BTC') || symbol.includes('ETH') ? 0.003 : 0.0012;
      const changePct = (Math.random() - 0.495) * volatility;
      const newPrice = Math.max(1.0, price * (1 + changePct));
      this.currentPrices.set(symbol, parseFloat(newPrice.toFixed(2)));
    }
  }

  public async getQuote(symbol: string): Promise<Quote> {
    const sym = symbol.toUpperCase();
    const info = MOCK_TICKERS[sym] || { name: `${sym} Asset`, basePrice: 100.0 };
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
      volume: Math.floor(Math.random() * 4000000) + 1500000,
      timestamp: new Date().toISOString()
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
      const volatility = 0.015;
      const deltaPct = (Math.sin(i / 4) * 0.005) + ((Math.random() - 0.49) * volatility);
      const open = currentClose * (1 - deltaPct);
      const close = currentClose;
      const high = Math.max(open, close) * (1 + Math.random() * 0.008);
      const low = Math.min(open, close) * (1 - Math.random() * 0.008);
      const volume = Math.floor(Math.random() * 5000000) + 1000000;

      bars.push({
        timestamp: barDate.toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      });

      // Step backwards for previous close
      currentClose = open;
    }

    return bars;
  }

  public async getOrderBook(symbol: string): Promise<OrderBook> {
    const sym = symbol.toUpperCase();
    const quote = await this.getQuote(sym);
    const mid = quote.price;
    const tick = mid > 500 ? 0.5 : 0.05;

    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    let bidTotal = 0;
    for (let i = 1; i <= 8; i++) {
      const p = parseFloat((mid - i * tick).toFixed(2));
      const size = Math.floor(Math.random() * 400) + 50;
      bidTotal += size;
      bids.push({ price: p, size, total: bidTotal });
    }

    let askTotal = 0;
    for (let i = 1; i <= 8; i++) {
      const p = parseFloat((mid + i * tick).toFixed(2));
      const size = Math.floor(Math.random() * 400) + 50;
      askTotal += size;
      asks.push({ price: p, size, total: askTotal });
    }

    return {
      symbol: sym,
      bids,
      asks,
      spread: parseFloat((asks[0].price - bids[0].price).toFixed(2)),
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance of market data adapter
export const marketDataService: MarketDataAdapter = new MockMarketDataAdapter();
