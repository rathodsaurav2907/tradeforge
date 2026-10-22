import React, { useEffect, useState } from 'react';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

interface SmartScoreCardProps {
  symbol: string;
  symbolOptions?: string[];
  onSymbolChange?: (symbol: string) => void;
}

const getTone = (score: number) => {
  if (score >= 75) return {
    label: 'Strong Buy',
    textClass: 'text-trade-green',
    borderClass: 'border-emerald-500/50',
    bgClass: 'bg-emerald-500/10'
  };
  if (score >= 60) return {
    label: 'Buy',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/30',
    bgClass: 'bg-emerald-500/10'
  };
  if (score >= 45) return {
    label: 'Hold',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-400/30',
    bgClass: 'bg-amber-500/10'
  };
  if (score >= 25) return {
    label: 'Caution',
    textClass: 'text-orange-300',
    borderClass: 'border-orange-400/30',
    bgClass: 'bg-orange-500/10'
  };
  return {
    label: 'Sell',
    textClass: 'text-red-300',
    borderClass: 'border-red-400/30',
    bgClass: 'bg-red-500/10'
  };
};

export const SmartScoreCard: React.FC<SmartScoreCardProps> = ({
  symbol,
  symbolOptions = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS', 'SBIN', 'NIFTY50'],
  onSymbolChange
}) => {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getSmartScore(symbol);
        if (active) {
          setScore(data.score);
          setSummary(data.summary || 'Signal evaluation based on trend, momentum, and volatility.');
        }
      } catch (err) {
        console.error('Failed to load smart score', err);
        if (active) {
          setScore(null);
          setSummary('Smart score unavailable right now.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [symbol]);

  const currentTone = score === null ? { label: 'Loading', textClass: 'text-slate-300', borderClass: 'border-slate-600', bgClass: 'bg-slate-500/10' } : getTone(score);

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 shadow-sm shadow-black/20">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-trade-cyan" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-mono">Smart Score</span>
        </div>

        {symbolOptions.length > 0 && onSymbolChange && (
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="bg-dark-900 border border-dark-600 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-trade-cyan"
          >
            {symbolOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
      </div>

      {loading || score === null ? (
        <div className="flex items-center justify-center py-6 text-xs text-slate-400">Calculating signal strength...</div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className={`text-4xl font-black tracking-tight ${currentTone.textClass}`}>{Math.round(score)}</div>
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${currentTone.bgClass} ${currentTone.borderClass} ${currentTone.textClass}`}>
              {currentTone.label}
            </div>
          </div>

          <div className="mt-3 h-2 w-full bg-dark-900 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${score >= 50 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
              style={{ width: `${Math.max(6, Math.min(100, score))}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-slate-300">
            <div className="bg-dark-900/80 border border-dark-700 rounded-xl p-2">
              <div className="text-slate-400 mb-1">Trend</div>
              <div className="flex items-center gap-1 font-bold text-white">
                {score >= 50 ? <TrendingUp className="w-3.5 h-3.5 text-trade-green" /> : <TrendingDown className="w-3.5 h-3.5 text-trade-red" />}
                {score >= 50 ? 'Bullish' : 'Weak'}
              </div>
            </div>
            <div className="bg-dark-900/80 border border-dark-700 rounded-xl p-2">
              <div className="text-slate-400 mb-1">Momentum</div>
              <div className="font-bold text-white">{score >= 50 ? '+' : ''}{Math.round((score - 50) * 2)} pts</div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-400 leading-relaxed">{summary}</div>
        </>
      )}
    </div>
  );
};

export default SmartScoreCard;
