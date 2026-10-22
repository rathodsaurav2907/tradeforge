import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Star, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Smile, 
  Frown, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Filter
} from 'lucide-react';
import { JournalEntry, JournalStats, formatINR, api } from '../services/api';

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Entry Form State
  const [symbol, setSymbol] = useState('RELIANCE');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('2900');
  const [exitPrice, setExitPrice] = useState('2950');
  const [quantity, setQuantity] = useState('50');
  const [setupTag, setSetupTag] = useState('Support Bounce');
  const [emotionalState, setEmotionalState] = useState<'DISCIPLINED' | 'PATIENT' | 'ANXIOUS' | 'FOMO'>('DISCIPLINED');
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');

  const loadJournal = async () => {
    setLoading(true);
    try {
      const [entriesRes, statsRes] = await Promise.all([
        api.getJournalEntries(),
        api.getJournalStats()
      ]);
      setEntries(entriesRes);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournal();
  }, []);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pnlVal = (parseFloat(exitPrice) - parseFloat(entryPrice)) * parseFloat(quantity) * (tradeType === 'BUY' ? 1 : -1);

      await api.createJournalEntry({
        symbol,
        tradeType,
        entryPrice: parseFloat(entryPrice),
        exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
        quantity: parseFloat(quantity),
        setupTag,
        emotionalState,
        rating,
        pnl: pnlVal,
        notes
      });

      setShowModal(false);
      setNotes('');
      await loadJournal();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this journal reflection?')) return;
    try {
      await api.deleteJournalEntry(id);
      await loadJournal();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-800 p-5 rounded-2xl border border-dark-700">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-trade-cyan" />
            <h1 className="text-xl font-bold text-white tracking-tight">Trader's Journal & Mindset Hub</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build deliberate practice, track emotional discipline, and master setups over time
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-trade-green hover:bg-trade-greenHover text-dark-900 font-bold rounded-xl text-xs flex items-center gap-2 shrink-0 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Log Trade Reflection
        </button>
      </div>

      {/* Psychology & Discipline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Win Rate %</div>
          <div className="text-2xl font-bold font-mono text-white">
            {stats ? `${stats.winRate}%` : '0%'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Based on {stats?.totalLogged || 0} documented trades
          </div>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Discipline Score</span>
            <CheckCircle className="w-3.5 h-3.5 text-trade-green" />
          </div>
          <div className="text-2xl font-bold font-mono text-trade-green">
            {stats ? `${stats.disciplineScore}%` : '100%'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Adherence to plan vs FOMO trades
          </div>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Top Setup</div>
          <div className="text-xl font-bold font-mono text-trade-cyan truncate">
            {stats?.topSetup || 'Support Bounce'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Highest frequency / profit edge
          </div>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Avg Execution Rating</div>
          <div className="text-2xl font-bold font-mono text-amber-400 flex items-center gap-1">
            <span>{stats?.averageRating || '5.0'}</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Out of 5.0 self-rated quality
          </div>
        </div>
      </div>

      {/* Modal: Log Trade */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-700 max-w-lg w-full p-6 rounded-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-dark-700 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-trade-green" />
                Log Trade Reflection
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Symbol</label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-trade-green"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Trade Side</label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value as any)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-trade-green"
                  >
                    <option value="BUY">BUY / LONG</option>
                    <option value="SELL">SELL / SHORT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Entry (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-trade-green"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Exit (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-trade-green"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-trade-green"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Setup Type</label>
                  <select
                    value={setupTag}
                    onChange={(e) => setSetupTag(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-trade-green"
                  >
                    <option value="Support Bounce">Support Bounce</option>
                    <option value="Breakout">Breakout</option>
                    <option value="Mean Reversion">Mean Reversion</option>
                    <option value="Gap & Go">Gap & Go</option>
                    <option value="VWAP Pullback">VWAP Pullback</option>
                    <option value="Earnings / News">Earnings / News</option>
                    <option value="FOMO / Impulse">FOMO / Impulse (Mistake)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Emotional State</label>
                  <select
                    value={emotionalState}
                    onChange={(e) => setEmotionalState(e.target.value as any)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-trade-green"
                  >
                    <option value="DISCIPLINED">Disciplined & Calm</option>
                    <option value="PATIENT">Patient (Waited for trigger)</option>
                    <option value="ANXIOUS">Anxious / Hesitant</option>
                    <option value="FOMO">FOMO / Chasing price</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Execution Quality ({rating} / 5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1.5 rounded-lg border transition ${
                        rating >= star ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-dark-900 text-slate-600 border-dark-700'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${rating >= star ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Trading Thesis & Lessons Learned
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Why did you take this trade? What did the price action do? What will you do differently next time?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-trade-green"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-dark-900 text-slate-300 rounded-xl text-xs font-semibold border border-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-trade-green text-dark-900 rounded-xl text-xs font-bold"
                >
                  Save Reflection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries Timeline */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Journal Log ({entries.length})</span>
        </h2>

        {entries.length === 0 ? (
          <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 text-center text-slate-400 text-xs space-y-2">
            <p>No trading journal entries yet.</p>
            <p className="text-slate-500">Every disciplined trader tracks their mental state and setups. Log your first trade above!</p>
          </div>
        ) : (
          entries.map((entry) => {
            const isProfit = (entry.pnl || 0) >= 0;
            return (
              <div
                key={entry.id}
                className="bg-dark-800 p-5 rounded-2xl border border-dark-700 hover:border-slate-600/80 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-700/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">{entry.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${entry.tradeType === 'BUY' ? 'bg-emerald-950 text-trade-green' : 'bg-red-950 text-trade-red'}`}>
                      {entry.tradeType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-cyan-950 text-trade-cyan border border-cyan-800">
                      {entry.setupTag}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                      entry.emotionalState === 'DISCIPLINED' || entry.emotionalState === 'PATIENT'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {entry.emotionalState}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: entry.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                    {entry.pnl !== undefined && (
                      <span className={`font-mono text-xs font-bold ${isProfit ? 'text-trade-green' : 'text-trade-red'}`}>
                        {isProfit ? '+' : ''}{formatINR(entry.pnl)}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-slate-500 hover:text-trade-red transition p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-dark-900/60 p-2.5 rounded-xl border border-dark-700/50">
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">Entry Price</span>
                    <span className="text-white font-bold">{formatINR(entry.entryPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">Exit Price</span>
                    <span className="text-white font-bold">{entry.exitPrice ? formatINR(entry.exitPrice) : 'Open'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">Quantity</span>
                    <span className="text-slate-200">{entry.quantity} shares</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-sans block">Logged Date</span>
                    <span className="text-slate-400">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed bg-dark-900/30 p-3 rounded-xl border border-dark-700/30">
                  "{entry.notes}"
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
