import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { Quote, PortfolioSummary, formatINR, api } from '../services/api';

interface DashboardProps {
  portfolio: PortfolioSummary | null;
  quotes: Quote[];
  onSelectSymbol: (symbol: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  portfolio,
  quotes,
  onSelectSymbol,
  onNavigateTab
}) => {
  const [selectedQuickSymbol, setSelectedQuickSymbol] = useState('RELIANCE');
  const [quickSide, setQuickSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quickQty, setQuickQty] = useState(10);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const gainers = [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const losers = [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  const handleQuickTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderLoading(true);
    setOrderMessage(null);
    try {
      const res = await api.placeOrder({
        symbol: selectedQuickSymbol,
        side: quickSide,
        orderType: 'MARKET',
        quantity: quickQty
      });
      setOrderMessage({ text: `Simulated Fill: ${quickSide} ${quickQty} ${selectedQuickSymbol} in INR` });
      setTimeout(() => setOrderMessage(null), 4000);
    } catch (err: any) {
      setOrderMessage({ text: err.response?.data?.error || err.message, error: true });
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Prominent Compliance & Delayed Data Disclaimer Banner */}
      <div className="bg-amber-950/40 border border-amber-600/50 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <span className="font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
            Educational Disclaimer · Delayed Data & Simulated Fills
          </span>
          Market data is sourced from permitted educational feeds and is delayed by at least 15 minutes. All portfolios, order placements, and execution fills are strictly simulated with zero real monetary value or broker interaction. TradeForge is intended solely for risk-free strategy evaluation and trading psychology development.
        </div>
      </div>

      {/* Top Metric Cards in INR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equity */}
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Virtual Account Equity</span>
            <span className="text-trade-green font-bold text-sm">₹</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatINR(portfolio?.totalEquity || 1000000)}
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-400">
            <span>Available Cash:</span>
            <span className="font-mono text-slate-200">
              {formatINR(portfolio?.cashBalance || 1000000)}
            </span>
          </div>
        </div>

        {/* Day P&L */}
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Today's P&L</span>
            {portfolio && portfolio.dayPnL >= 0 ? (
              <TrendingUp className="w-4 h-4 text-trade-green" />
            ) : (
              <TrendingDown className="w-4 h-4 text-trade-red" />
            )}
          </div>
          <div className={`text-2xl font-bold font-mono ${portfolio && portfolio.dayPnL >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
            {portfolio && portfolio.dayPnL >= 0 ? '+' : ''}{formatINR(portfolio?.dayPnL || 0)}
          </div>
          <div className="mt-2 text-xs flex items-center gap-1 text-slate-400">
            <span className={portfolio && portfolio.dayPnLPercent >= 0 ? 'text-trade-green' : 'text-trade-red'}>
              {portfolio && portfolio.dayPnLPercent >= 0 ? '+' : ''}{portfolio ? portfolio.dayPnLPercent.toFixed(2) : '0.00'}%
            </span>
            <span>simulated return</span>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Unrealized P&L</span>
            <PieChart className="w-4 h-4 text-trade-cyan" />
          </div>
          <div className={`text-2xl font-bold font-mono ${portfolio && portfolio.unrealizedPnL >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
            {portfolio && portfolio.unrealizedPnL >= 0 ? '+' : ''}{formatINR(portfolio?.unrealizedPnL || 0)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Open Indian stock holdings
          </div>
        </div>

        {/* Realized Capital Gains */}
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Realized Gains</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            +{formatINR(portfolio?.realizedPnL || 8450)}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Locked gains on closed trades
          </div>
        </div>
      </div>

      {/* Main Grid: AI Engine Banner & Fast Order Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Enhanced Trading & Journal Highlight */}
        <div className="lg:col-span-2 bg-gradient-to-br from-dark-800 via-dark-800 to-emerald-950/30 p-6 rounded-2xl border border-dark-700 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/10 text-trade-green rounded-xl border border-emerald-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">AI-Powered Quantitative Engine (INR)</h2>
                <p className="text-xs text-slate-400">Vectorized momentum & ATR risk calculations running on Python pandas & numpy</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('journal')}
              className="px-3 py-1 bg-trade-cyan/10 hover:bg-trade-cyan/20 text-trade-cyan border border-trade-cyan/30 rounded-xl text-xs flex items-center gap-1.5 font-semibold transition"
            >
              <BookOpen className="w-3.5 h-3.5" /> Open Trading Journal →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
            <div className="bg-dark-900/80 p-3.5 rounded-xl border border-dark-700/60">
              <div className="text-[11px] text-slate-400 font-medium">Momentum Synthesis</div>
              <div className="text-base font-bold text-emerald-400 mt-1">Multi-EMA & RSI</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Detects mean reversion & breakout conditions</div>
            </div>
            <div className="bg-dark-900/80 p-3.5 rounded-xl border border-dark-700/60">
              <div className="text-[11px] text-slate-400 font-medium">Risk Management</div>
              <div className="text-base font-bold text-trade-cyan mt-1">ATR Stop-Loss Rule</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Automated 1.5x ATR stops & 3.0x targets</div>
            </div>
            <div className="bg-dark-900/80 p-3.5 rounded-xl border border-dark-700/60">
              <div className="text-[11px] text-slate-400 font-medium">Psychology Tracker</div>
              <div className="text-base font-bold text-indigo-400 mt-1">Trading Journal</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Track emotional discipline & setups</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-400">Scan Indian Leaders:</span>
            {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS'].map((sym) => (
              <button
                key={sym}
                onClick={() => {
                  onSelectSymbol(sym);
                  onNavigateTab('charts');
                }}
                className="px-3 py-1 bg-dark-900 hover:bg-dark-700 text-xs font-mono font-medium rounded-lg border border-dark-700 text-slate-200 hover:border-trade-green transition"
              >
                {sym} →
              </button>
            ))}
          </div>
        </div>

        {/* Quick Paper Order Widget in INR */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-trade-green inline-block" />
                Quick Paper Order
              </h2>
              <span className="text-[10px] font-mono bg-dark-900 px-2 py-0.5 rounded text-trade-cyan">
                INR (₹)
              </span>
            </div>

            {orderMessage && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-medium ${orderMessage.error ? 'bg-red-950/80 text-red-300 border border-red-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'}`}>
                {orderMessage.text}
              </div>
            )}

            <form onSubmit={handleQuickTrade} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Asset</label>
                <select
                  value={selectedQuickSymbol}
                  onChange={(e) => setSelectedQuickSymbol(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-trade-green font-mono"
                >
                  {quotes.map((q) => (
                    <option key={q.symbol} value={q.symbol}>
                      {q.symbol} - {formatINR(q.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickSide('BUY')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${quickSide === 'BUY' ? 'bg-trade-green text-dark-900' : 'bg-dark-900 text-slate-400 border border-dark-700'}`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSide('SELL')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${quickSide === 'SELL' ? 'bg-trade-red text-white' : 'bg-dark-900 text-slate-400 border border-dark-700'}`}
                >
                  SELL / SHORT
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Quantity (Shares)</label>
                <input
                  type="number"
                  min="1"
                  value={quickQty}
                  onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-trade-green font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={orderLoading}
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-trade-green to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-dark-900 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
              >
                {orderLoading ? 'Simulating Fill...' : `Simulate ${quickSide} in INR`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Top Gainers & Losers in INR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-trade-green" />
              Top Market Gainers (NSE)
            </h3>
            <span className="text-xs text-slate-400">24h Change</span>
          </div>
          <div className="space-y-2.5">
            {gainers.map((q) => (
              <div
                key={q.symbol}
                onClick={() => {
                  onSelectSymbol(q.symbol);
                  onNavigateTab('charts');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-900/70 hover:bg-dark-700/60 border border-dark-700/60 cursor-pointer transition"
              >
                <div>
                  <div className="font-mono font-bold text-sm text-white">{q.symbol}</div>
                  <div className="text-xs text-slate-400">{q.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-slate-200">{formatINR(q.price)}</div>
                  <div className="font-mono text-xs text-trade-green font-semibold">
                    +{q.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-trade-red" />
              Top Market Losers (NSE)
            </h3>
            <span className="text-xs text-slate-400">24h Change</span>
          </div>
          <div className="space-y-2.5">
            {losers.map((q) => (
              <div
                key={q.symbol}
                onClick={() => {
                  onSelectSymbol(q.symbol);
                  onNavigateTab('charts');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-900/70 hover:bg-dark-700/60 border border-dark-700/60 cursor-pointer transition"
              >
                <div>
                  <div className="font-mono font-bold text-sm text-white">{q.symbol}</div>
                  <div className="text-xs text-slate-400">{q.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-slate-200">{formatINR(q.price)}</div>
                  <div className="font-mono text-xs text-trade-red font-semibold">
                    {q.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
