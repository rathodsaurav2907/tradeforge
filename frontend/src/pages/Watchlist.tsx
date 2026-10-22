import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Sparkles, ShoppingCart, BarChart2 } from 'lucide-react';
import { Quote } from '../services/api';

interface WatchlistProps {
  quotes: Quote[];
  onSelectSymbol: (symbol: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  quotes,
  onSelectSymbol,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuotes = quotes.filter(
    (q) =>
      q.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-800 p-5 rounded-2xl border border-dark-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Market Watchlist</h1>
          <p className="text-xs text-slate-400">Real-time mock feed across equities, ETFs, and cryptocurrencies</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symbol (e.g. NVDA, AAPL)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-trade-green"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-dark-700">
              <tr>
                <th className="px-6 py-3.5">Asset</th>
                <th className="px-6 py-3.5 text-right">Price</th>
                <th className="px-6 py-3.5 text-right">24h Change</th>
                <th className="px-6 py-3.5 text-right">24h High / Low</th>
                <th className="px-6 py-3.5 text-right">Volume</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/60 font-mono">
              {filteredQuotes.map((q) => {
                const isPos = q.change >= 0;
                return (
                  <tr key={q.symbol} className="hover:bg-dark-700/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        {q.symbol}
                        {q.symbol === 'NVDA' && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/10 text-trade-green border border-emerald-500/30 rounded font-sans font-semibold">
                            HOT
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-sans text-slate-400">{q.name}</div>
                    </td>

                    <td className="px-6 py-4 text-right font-bold text-slate-100">
                      ${q.price.toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold flex items-center justify-end gap-1 ${isPos ? 'text-trade-green' : 'text-trade-red'}`}>
                        {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {isPos ? '+' : ''}{q.changePercent.toFixed(2)}%
                      </div>
                      <div className="text-xs text-slate-400">
                        {isPos ? '+' : ''}${q.change.toFixed(2)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right text-xs text-slate-300">
                      <div>H: ${q.high.toFixed(2)}</div>
                      <div className="text-slate-500">L: ${q.low.toFixed(2)}</div>
                    </td>

                    <td className="px-6 py-4 text-right text-xs text-slate-300">
                      {q.volume.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 font-sans">
                        <button
                          onClick={() => {
                            onSelectSymbol(q.symbol);
                            onNavigateTab('charts');
                          }}
                          title="View Chart & AI Signals"
                          className="p-1.5 bg-dark-700 hover:bg-dark-600 text-trade-cyan rounded-lg border border-slate-700 transition"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            onSelectSymbol(q.symbol);
                            onNavigateTab('orders');
                          }}
                          title="Open Trade Ticket"
                          className="px-3 py-1.5 bg-trade-green/10 hover:bg-trade-green text-trade-green hover:text-dark-900 border border-trade-green/30 text-xs font-semibold rounded-lg transition"
                        >
                          Trade
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
