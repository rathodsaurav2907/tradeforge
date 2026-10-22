export interface BrokerCredentials {
  broker: 'ZERODHA' | 'DHAN' | 'SANDBOX';
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
  clientId?: string;
}

export interface BrokerFunds {
  availableMargin: number;
  usedMargin: number;
  totalBalance: number;
  collateral: number;
  currency: string;
}

export interface BrokerPosition {
  symbol: string;
  product: 'CNC' | 'MIS' | 'NRML';
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface BrokerHolding {
  symbol: string;
  isin: string;
  quantity: number;
  t1Quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface LiveOrderInput {
  symbol: string;
  exchange: 'NSE' | 'BSE' | 'NFO';
  side: 'BUY' | 'SELL';
  product: 'CNC' | 'MIS';
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  quantity: number;
  price?: number;
  triggerPrice?: number;
}

export interface LiveOrderResult {
  orderId: string;
  status: 'SUBMITTED' | 'OPEN' | 'COMPLETE' | 'REJECTED' | 'CANCELLED';
  message: string;
  exchangeOrderId?: string;
  averagePrice?: number;
  executedQuantity?: number;
}

export interface IBrokerAdapter {
  name: string;
  connect(credentials: BrokerCredentials): Promise<{ success: boolean; message: string; user?: any }>;
  isConnected(): boolean;
  getFunds(): Promise<BrokerFunds>;
  getPositions(): Promise<BrokerPosition[]>;
  getHoldings(): Promise<BrokerHolding[]>;
  placeOrder(order: LiveOrderInput): Promise<LiveOrderResult>;
  cancelOrder(orderId: string): Promise<boolean>;
  squareOffPosition(symbol: string, product: 'CNC' | 'MIS', quantity: number): Promise<LiveOrderResult>;
  squareOffAll(): Promise<{ cancelledOrders: number; squaredOffPositions: number }>;
}
