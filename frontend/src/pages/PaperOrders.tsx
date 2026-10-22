import React, { useState, useEffect } from 'react';
import { 
  Send, 
  XCircle, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ShieldCheck,
  AlertTriangle,
  BookOpen 
} from 'lucide-react';
import { Quote, OrderBook, OrderRecord, PortfolioSummary, formatINR, api } from '../services/api';

interface PaperOrdersProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  quotes: Quote[];
  portfolio: PortfolioSummary | null;
  onOrderPlaced: () => void;
}

export const PaperOrders: React.FC<PaperOrdersProps> = ({
  selectedSymbol,
  onSelectSymbol,
  quotes,
  portfolio,
  onOrderPlaced
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('MARKET');
  const [quantity, setQuantity] = useState(10);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const effectivePrice = orderType === 'MARKET' ? (currentQuote?.price || 0) : limitPrice;
  const estimatedCost = parseFloat((effectivePrice * quantity).toFixed(2));

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.placeOrder({
        symbol: selectedSymbol,
        side,
        orderType,
        quantity,
        price: orderType !== 'MARKET' ? limitPrice : undefined
      });
      setMessage({ text: `${res.message} (Paper INR)` });
      onOrderPlaced();
      await loadData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || err.message, error: true });
    } finally {
      setLoading(false);
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
      {/* Simulation Warning Banner */}
      <div className="bg-dark-800/90 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-300">Simulated Fills Notice:</strong> Orders placed in this terminal are virtual paper trades denominated in Indian Rupee (₹ INR). No capital is risked.
          </span>
        </div>
        <div className="font-mono text-slate-400">
          Available Cash: <span className="font-bold text-emerald-400">{formatINR(portfolio?.cashBalance || 1000000)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Execution Ticket */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 space-y-5">
          <div className="flex items-center justify-between border-b border-dark-700/80 pb-3">
            <h2 className="font-bold text-white text-sm">Paper Order Ticket</h2>
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

            {/* Cost Summary Box in INR */}
            <div className="bg-dark-900 p-3.5 rounded-xl border border-dark-700/80 font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Unit Price:</span>
                <span className="font-mono text-slate-200">{formatINR(effectivePrice)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-sans">
                <span>Estimated Order Value:</span>
                <span className="font-mono font-bold text-white">{formatINR(estimatedCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-sans text-[11px] pt-1 border-t border-dark-700">
                <span>Brokerage / STT:</span>
                <span className="text-trade-green font-mono">₹0.00 (Simulated Demo)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg ${
                side === 'BUY'
                  ? 'bg-trade-green hover:bg-trade-greenHover text-dark-900'
                  : 'bg-trade-red hover:bg-trade-redHover text-white'
              }`}
            >
              {loading ? 'Simulating Execution...' : `Submit ${side} Order (₹)`}
            </button>
          </form>
        </div>

        {/* Middle & Right: Level 2 Order Book & Orders Table */}
        <div className="lg:col-span-2 space-y-6">
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
              {/* Bids */}
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

              {/* Asks */}
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

          {/* Orders Log in INR */}
          <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Paper Order History & Fill Status (INR)
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
                        No orders recorded yet. Submit your first simulated order above!
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
                            o.status === 'FILLED' ? 'bg-emerald-500/10 text-trade-green border border-emerald-500/30' :
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
