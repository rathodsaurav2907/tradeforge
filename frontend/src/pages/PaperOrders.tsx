import React, { useState, useEffect } from 'react';
import { 
  Send, 
  XCircle, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ShieldCheck,
  AlertTriangle,
  Radio,
  Briefcase,
  AlertOctagon 
} from 'lucide-react';
import { 
  Quote, 
  OrderBook, 
  OrderRecord, 
  PortfolioSummary, 
  BrokerFunds, 
  BrokerPosition, 
  BrokerHolding, 
  formatINR, 
  api 
} from '../services/api';

interface PaperOrdersProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  quotes: Quote[];
  portfolio: PortfolioSummary | null;
  mode: 'PAPER' | 'LIVE';
  onOrderPlaced: () => void;
}

export const PaperOrders: React.FC<PaperOrdersProps> = ({
  selectedSymbol,
  onSelectSymbol,
  quotes,
  portfolio,
  mode,
  onOrderPlaced
}) => {
  const isLive = mode === 'LIVE';

  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [product, setProduct] = useState<'MIS' | 'CNC'>('MIS');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('MARKET');
  const [quantity, setQuantity] = useState(10);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);

  // Live Broker State
  const [brokerFunds, setBrokerFunds] = useState<BrokerFunds | null>(null);
  const [livePositions, setLivePositions] = useState<BrokerPosition[]>([]);
  const [liveHoldings, setLiveHoldings] = useState<BrokerHolding[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const currentQuote = quotes.find(q => q.symbol === selectedSymbol) || quotes[0];

  useEffect(() => {
    if (currentQuote && limitPrice === 0) {
      setLimitPrice(currentQuote.price);
    }
  }, [currentQuote]);

  const loadData = async () => {
    try {
      const [ordersRes, bookRes] = await Promise.all([
        api.getOrders(),
        api.getOrderBook(selectedSymbol)
      ]);
      setOrders(ordersRes);
      setOrderBook(bookRes);

      if (isLive) {
        const [fundsRes, posRes, holdRes] = await Promise.all([
          api.getBrokerFunds(),
          api.getBrokerPositions(),
          api.getBrokerHoldings()
        ]);
        setBrokerFunds(fundsRes);
        setLivePositions(posRes);
        setLiveHoldings(holdRes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [selectedSymbol, mode]);

  const effectivePrice = orderType === 'MARKET' ? (currentQuote?.price || 0) : limitPrice;
  const estimatedCost = parseFloat((effectivePrice * quantity).toFixed(2));
  // MIS gives 5x leverage in Indian equity markets (20% margin required)
  const requiredMargin = product === 'MIS' ? estimatedCost * 0.2 : estimatedCost;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLive) {
        // Route through Live Broker Gateway & Risk Engine
        const res = await api.placeLiveBrokerOrder({
          symbol: selectedSymbol,
          side,
          product,
          orderType: orderType === 'STOP_LOSS' ? 'SL-M' : (orderType as any),
          quantity,
          price: orderType !== 'MARKET' ? limitPrice : undefined
        });
        setMessage({ text: res.message });
      } else {
        // Route through Paper Trading Engine
        const res = await api.placeOrder({
          symbol: selectedSymbol,
          side,
          orderType,
          quantity,
          price: orderType !== 'MARKET' ? limitPrice : undefined
        });
        setMessage({ text: `${res.message} (Paper Simulation)` });
      }

      onOrderPlaced();
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || err.message, error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSquareOffLive = async (pos: BrokerPosition) => {
    if (!confirm(`Confirm market square-off for ${pos.quantity} shares of ${pos.symbol} (${pos.product})?`)) return;
    try {
      await api.squareOffBrokerPosition({
        symbol: pos.symbol,
        product: pos.product as any,
        quantity: pos.quantity
      });
      await loadData();
      onOrderPlaced();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      await loadData();
      onOrderPlaced();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Mode Header Banner */}
      {isLive ? (
        <div className="bg-red-950/60 border border-red-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-100 shadow-md">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-trade-red animate-pulse shrink-0" />
            <div>
              <strong className="text-white text-sm block">🔴 LIVE BROKER EXECUTION MODE ACTIVE</strong>
              Orders submitted on this ticket are routed through Zerodha Kite Connect with real margin commitment. Pre-trade risk controls enforce max order limit ₹1,00,000.
            </div>
          </div>
          <div className="font-mono bg-dark-900/80 px-3 py-1.5 rounded-xl border border-red-800 text-right shrink-0">
            Available Broker Margin: <span className="font-bold text-emerald-400">{formatINR(brokerFunds?.availableMargin || 450000)}</span>
          </div>
        </div>
      ) : (
        <div className="bg-dark-800/90 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-trade-green shrink-0" />
            <span>
              <strong className="text-emerald-300">Paper Trading Simulator Active:</strong> Virtual orders in Indian Rupee (₹ INR). Zero real money at risk.
            </span>
          </div>
          <div className="font-mono text-slate-400">
            Available Cash: <span className="font-bold text-emerald-400">{formatINR(portfolio?.cashBalance || 1000000)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Execution Ticket */}
        <div className={`p-6 rounded-2xl border space-y-5 ${isLive ? 'bg-dark-800 border-red-800/60' : 'bg-dark-800 border-dark-700'}`}>
          <div className="flex items-center justify-between border-b border-dark-700/80 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">
                {isLive ? 'Live Broker Ticket' : 'Paper Order Ticket'}
              </h2>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isLive ? 'bg-red-950 text-trade-red border border-red-800' : 'bg-emerald-950 text-trade-green'}`}>
                {isLive ? 'LIVE BROKER' : 'SIMULATION'}
              </span>
            </div>
            <span className="text-xs font-mono text-trade-cyan">{formatINR(currentQuote?.price || 0)}</span>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-medium ${message.error ? 'bg-red-950/80 text-red-300 border border-red-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Symbol Picker */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Asset (NSE / BSE)</label>
              <select
                value={selectedSymbol}
                onChange={(e) => {
                  onSelectSymbol(e.target.value);
                  const q = quotes.find(item => item.symbol === e.target.value);
                  if (q) setLimitPrice(q.price);
                }}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-trade-green font-mono"
              >
                {quotes.map((q) => (
                  <option key={q.symbol} value={q.symbol}>
                    {q.symbol} - {formatINR(q.price)}
                  </option>
                ))}
              </select>
            </div>

            {/* Side Switch */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  side === 'BUY' ? 'bg-trade-green text-dark-900 shadow-md' : 'bg-dark-900 text-slate-400 border border-dark-700'
                }`}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 text-xs font-bold rounded-xl transition ${
                  side === 'SELL' ? 'bg-trade-red text-white shadow-md' : 'bg-dark-900 text-slate-400 border border-dark-700'
                }`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Product Type (CNC vs MIS) */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Product Type</label>
              <div className="grid grid-cols-2 gap-2 bg-dark-900 p-1 rounded-xl border border-dark-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setProduct('MIS')}
                  className={`py-1.5 rounded-lg transition ${
                    product === 'MIS' ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  MIS (Intraday 5x)
                </button>
                <button
                  type="button"
                  onClick={() => setProduct('CNC')}
                  className={`py-1.5 rounded-lg transition ${
                    product === 'CNC' ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CNC (Delivery 1x)
                </button>
              </div>
            </div>

            {/* Order Type */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Execution Type</label>
              <div className="grid grid-cols-3 gap-1.5 bg-dark-900 p-1 rounded-xl border border-dark-700 text-xs font-semibold">
                {(['MARKET', 'LIMIT', 'STOP_LOSS'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={`py-1.5 rounded-lg transition ${
                      orderType === t ? 'bg-dark-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Price (if Limit or Stop) */}
            {orderType !== 'MARKET' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  {orderType === 'LIMIT' ? 'Limit Price (₹)' : 'Stop Trigger Price (₹)'}
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-trade-green font-mono"
                />
              </div>
            )}

            {/* Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400">Quantity (Shares)</label>
                <div className="flex gap-1">
                  {[10, 25, 50, 100].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className="px-2 py-0.5 bg-dark-900 hover:bg-dark-700 text-[10px] text-slate-300 rounded border border-dark-700 font-mono"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-trade-green font-mono"
              />
            </div>

            {/* Margin Calculation Preview in INR */}
            <div className="bg-dark-900 p-3.5 rounded-xl border border-dark-700/80 font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Order Value:</span>
                <span className="font-mono text-slate-200">{formatINR(estimatedCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Required Margin ({product}):</span>
                <span className="font-mono font-bold text-white">{formatINR(requiredMargin)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-sans text-[11px] pt-1 border-t border-dark-700">
                <span>Pre-Trade Risk Engine:</span>
                <span className="text-trade-green font-mono">Max ₹1,00,000 / Order</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg ${
                isLive
                  ? side === 'BUY' ? 'bg-trade-green hover:bg-trade-greenHover text-dark-900' : 'bg-trade-red hover:bg-trade-redHover text-white'
                  : side === 'BUY' ? 'bg-trade-green hover:bg-trade-greenHover text-dark-900' : 'bg-trade-red hover:bg-trade-redHover text-white'
              }`}
            >
              {loading ? 'Routing Order...' : isLive ? `Execute Live ${side} on Exchange` : `Submit Paper ${side} Order`}
            </button>
          </form>
        </div>

        {/* Middle & Right: Level 2 Order Book & Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* If in LIVE mode: Show Live Broker Positions */}
          {isLive && (
            <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-trade-cyan" />
                  Live Broker Net Positions (Zerodha Kite)
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {livePositions.length} Open Position(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-dark-900/80 text-[10px] font-sans font-semibold uppercase text-slate-400 border-b border-dark-700">
                    <tr>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Buy Price</th>
                      <th className="py-2.5 px-3 text-right">LTP</th>
                      <th className="py-2.5 px-3 text-right">P&L (INR)</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/60">
                    {livePositions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-5 text-center text-slate-500 font-sans">
                          No open intraday/live positions on broker.
                        </td>
                      </tr>
                    ) : (
                      livePositions.map((pos) => {
                        const isPos = pos.pnl >= 0;
                        return (
                          <tr key={pos.symbol} className="hover:bg-dark-700/40">
                            <td className="py-2.5 px-3 font-bold text-white">{pos.symbol}</td>
                            <td className="py-2.5 px-3 text-slate-400">{pos.product}</td>
                            <td className="py-2.5 px-3 text-right text-slate-200">{pos.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-slate-300">{formatINR(pos.buyPrice)}</td>
                            <td className="py-2.5 px-3 text-right text-white font-bold">{formatINR(pos.currentPrice)}</td>
                            <td className={`py-2.5 px-3 text-right font-bold ${isPos ? 'text-trade-green' : 'text-trade-red'}`}>
                              {isPos ? '+' : ''}{formatINR(pos.pnl)} ({isPos ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleSquareOffLive(pos)}
                                className="px-2.5 py-1 bg-red-950/80 text-trade-red border border-red-800 rounded-lg text-[10px] font-bold hover:bg-trade-red hover:text-white transition"
                              >
                                Square Off
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Level 2 Order Book Depth Preview */}
          <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-trade-cyan" />
                Level 2 Order Book: {selectedSymbol} (NSE)
              </h3>
              <div className="text-xs font-mono text-slate-400">
                Spread: <span className="text-white">{formatINR(orderBook?.spread || 0.20)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <div className="text-[10px] uppercase font-sans font-semibold text-trade-green mb-1.5">
                  Bids (Buy Orders)
                </div>
                <div className="space-y-1">
                  {orderBook?.bids.slice(0, 5).map((b, i) => (
                    <div key={i} className="flex justify-between bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30">
                      <span className="text-trade-green font-bold">{formatINR(b.price)}</span>
                      <span className="text-slate-400">{b.size} qty</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-sans font-semibold text-trade-red mb-1.5">
                  Asks (Sell Orders)
                </div>
                <div className="space-y-1">
                  {orderBook?.asks.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex justify-between bg-red-950/20 px-2 py-1 rounded border border-red-900/30">
                      <span className="text-trade-red font-bold">{formatINR(a.price)}</span>
                      <span className="text-slate-400">{a.size} qty</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Log */}
          <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Order Book Records & History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-dark-900/80 text-[10px] font-sans font-semibold uppercase text-slate-400 border-b border-dark-700">
                  <tr>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Fill Price</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/60">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                        No orders recorded yet. Submit your first order above!
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-dark-700/40">
                        <td className="py-2.5 px-3 font-bold text-white">{o.symbol}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${o.side === 'BUY' ? 'bg-emerald-950 text-trade-green' : 'bg-red-950 text-trade-red'}`}>
                            {o.side}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{o.order_type}</td>
                        <td className="py-2.5 px-3 text-right">{o.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-200">
                          {o.avg_fill_price ? formatINR(o.avg_fill_price) : formatINR(o.price)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.status === 'FILLED' || o.status === 'COMPLETE' ? 'bg-emerald-500/10 text-trade-green border border-emerald-500/30' :
                            o.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-dark-900 text-slate-400'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {o.status === 'PENDING' ? (
                            <button
                              onClick={() => handleCancel(o.id)}
                              className="text-trade-red hover:underline font-sans text-[11px]"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
