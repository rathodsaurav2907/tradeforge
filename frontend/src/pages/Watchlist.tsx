import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ShoppingCart, 
  BarChart2, 
  Plus, 
  Trash2, 
  Layers,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Quote, WatchlistRecord, formatINR, api } from '../services/api';

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
  const [watchlists, setWatchlists] = useState<WatchlistRecord[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  const loadWatchlists = async () => {
    try {
      const lists = await api.getWatchlists();
      setWatchlists(lists);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadWatchlists();
  }, []);

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId);

  // Filter quotes based on active watchlist & search term
  const displayedQuotes = quotes.filter((q) => {
    const matchesSearch = q.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeWatchlistId === 'all') return true;
    return activeWatchlist ? activeWatchlist.symbols.includes(q.symbol) : true;
  });

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const created = await api.createWatchlist({
        name: newListName.trim(),
        description: newListDesc.trim(),
        symbols: ['RELIANCE', 'TCS']
      });
      setWatchlists(prev => [...prev, created]);
      setActiveWatchlistId(created.id);
      setNewListName('');
      setNewListDesc('');
      setShowCreateModal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleToggleSymbolInActiveWatchlist = async (symbol: string) => {
    if (activeWatchlistId === 'all' || !activeWatchlist) return;

    try {
      if (activeWatchlist.symbols.includes(symbol)) {
        const updated = await api.removeSymbolFromWatchlist(activeWatchlistId, symbol);
        setWatchlists(prev => prev.map(w => w.id === updated.id ? updated : w));
      } else {
        const updated = await api.addSymbolToWatchlist(activeWatchlistId, symbol);
        setWatchlists(prev => prev.map(w => w.id === updated.id ? updated : w));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    try {
      await api.deleteWatchlist(id);
      setWatchlists(prev => prev.filter(w => w.id !== id));
      setActiveWatchlistId('all');
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-800 p-5 rounded-2xl border border-dark-700">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Personalized Watchlists</h1>
            <span className="text-[10px] bg-dark-900 border border-slate-700 px-2 py-0.5 rounded text-trade-cyan font-mono">
              NSE / BSE (₹ INR)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-trade-green inline" />
            Permitted educational stream · 15-minute delayed market quotes
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker (e.g. RELIANCE)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-trade-green"
            />
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 bg-trade-green hover:bg-trade-greenHover text-dark-900 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Watchlist
          </button>
        </div>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveWatchlistId('all')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition shrink-0 ${
            activeWatchlistId === 'all'
              ? 'bg-dark-700 text-white border border-slate-600 shadow-sm'
              : 'bg-dark-800 text-slate-400 hover:text-white border border-dark-700'
          }`}
        >
          All Assets ({quotes.length})
        </button>

        {watchlists.map((w) => (
          <div key={w.id} className="flex items-center shrink-0">
            <button
              onClick={() => setActiveWatchlistId(w.id)}
              className={`px-3.5 py-1.5 rounded-l-xl font-semibold transition ${
                activeWatchlistId === w.id
                  ? 'bg-dark-700 text-white border-y border-l border-slate-600 shadow-sm'
                  : 'bg-dark-800 text-slate-400 hover:text-white border-y border-l border-dark-700'
              }`}
            >
              {w.name} ({w.symbols.length})
            </button>
            <button
              onClick={() => handleDeleteWatchlist(w.id)}
              title="Delete watchlist"
              className={`px-2 py-1.5 rounded-r-xl transition text-slate-500 hover:text-trade-red ${
                activeWatchlistId === w.id
                  ? 'bg-dark-700 border-y border-r border-slate-600'
                  : 'bg-dark-800 border-y border-r border-dark-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal: Create Watchlist */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-700 max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-dark-700 pb-3">
              <h3 className="font-bold text-white text-base">Create Custom Watchlist</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWatchlist} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Watchlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Momentum Breakouts, IT Leaders"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-trade-green"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. High-probability swing setups"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-trade-green"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-dark-900 text-slate-300 rounded-xl text-xs font-semibold border border-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-trade-green text-dark-900 rounded-xl text-xs font-bold"
                >
                  Create Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Watchlist Quotes Table */}
      <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-dark-900/80 text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400 border-b border-dark-700">
              <tr>
                <th className="px-6 py-3.5">Asset</th>
                <th className="px-6 py-3.5 text-right">Price (INR)</th>
                <th className="px-6 py-3.5 text-right">24h Change</th>
                <th className="px-6 py-3.5 text-right">24h High / Low</th>
                <th className="px-6 py-3.5 text-right">Volume</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/60">
              {displayedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No assets found in this watchlist. Add symbols using the toggle button below!
                  </td>
                </tr>
              ) : (
                displayedQuotes.map((q) => {
                  const isPos = q.change >= 0;
                  const isInActive = activeWatchlist ? activeWatchlist.symbols.includes(q.symbol) : false;

                  return (
                    <tr key={q.symbol} className="hover:bg-dark-700/40 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          {q.symbol}
                          {q.symbol === 'RELIANCE' && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/10 text-trade-green border border-emerald-500/30 rounded font-sans font-semibold">
                              LEADER
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-sans text-slate-400">{q.name}</div>
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-slate-100">
                        {formatINR(q.price)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold flex items-center justify-end gap-1 ${isPos ? 'text-trade-green' : 'text-trade-red'}`}>
                          {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {isPos ? '+' : ''}{q.changePercent.toFixed(2)}%
                        </div>
                        <div className="text-xs text-slate-400">
                          {isPos ? '+' : ''}{formatINR(q.change)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right text-xs text-slate-300">
                        <div>H: {formatINR(q.high)}</div>
                        <div className="text-slate-500">L: {formatINR(q.low)}</div>
                      </td>

                      <td className="px-6 py-4 text-right text-xs text-slate-300">
                        {q.volume.toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 font-sans">
                          {activeWatchlistId !== 'all' && (
                            <button
                              onClick={() => handleToggleSymbolInActiveWatchlist(q.symbol)}
                              title={isInActive ? 'Remove from this watchlist' : 'Add to this watchlist'}
                              className={`p-1.5 rounded-lg border text-xs transition ${
                                isInActive
                                  ? 'bg-emerald-950/80 text-trade-green border-emerald-800'
                                  : 'bg-dark-900 text-slate-400 border-dark-700 hover:text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onSelectSymbol(q.symbol);
                              onNavigateTab('charts');
                            }}
                            title="Inspect TradingView Candlestick Chart"
                            className="p-1.5 bg-dark-700 hover:bg-dark-600 text-trade-cyan rounded-lg border border-slate-700 transition"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              onSelectSymbol(q.symbol);
                              onNavigateTab('orders');
                            }}
                            title="Open Paper Trade Ticket in INR"
                            className="px-3 py-1.5 bg-trade-green/10 hover:bg-trade-green text-trade-green hover:text-dark-900 border border-trade-green/30 text-xs font-semibold rounded-lg transition"
                          >
                            Trade ₹
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
