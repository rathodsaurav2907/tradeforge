import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertCircle, 
  BarChart3, 
  Activity, 
  Sliders, 
  RefreshCw 
} from 'lucide-react';
import { Bar, AISignals, Quote, api } from '../services/api';

interface ChartsProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  quotes: Quote[];
}

export const Charts: React.FC<ChartsProps> = ({
  selectedSymbol,
  onSelectSymbol,
  quotes
}) => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [signals, setSignals] = useState<AISignals | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIndicators, setShowIndicators] = useState({
    sma20: true,
    ema9: true,
    bollinger: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch historical bars with Python indicators & AI signals
      const [indRes, sigRes] = await Promise.all([
        api.getIndicators(selectedSymbol),
        api.getAISignals(selectedSymbol)
      ]);
      setBars(indRes.bars || []);
      setSignals(sigRes);
    } catch (err) {
      console.error('Failed to load chart or signals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSymbol]);

  const currentQuote = quotes.find(q => q.symbol === selectedSymbol);

  // SVG Chart Dimensions & Scale calculations
  const chartHeight = 300;
  const chartWidth = 720;
  const padding = { top: 20, right: 30, bottom: 30, left: 20 };

  const minPrice = bars.length > 0 ? Math.min(...bars.map(b => b.low)) * 0.995 : 100;
  const maxPrice = bars.length > 0 ? Math.max(...bars.map(b => b.high)) * 1.005 : 200;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (val: number) => {
    const norm = (val - minPrice) / priceRange;
    return chartHeight - padding.bottom - norm * (chartHeight - padding.top - padding.bottom);
  };

  const getX = (index: number) => {
    const usableWidth = chartWidth - padding.left - padding.right;
    const step = bars.length > 1 ? usableWidth / (bars.length - 1) : 0;
    return padding.left + index * step;
  };

  // Generate SVG paths for indicator lines
  const generateLinePath = (key: 'sma_20' | 'ema_9' | 'bb_upper' | 'bb_lower') => {
    if (!bars.length) return '';
    return bars.reduce((path, bar, idx) => {
      const val = bar[key];
      if (val === undefined || val === null) return path;
      const x = getX(idx);
      const y = getY(val);
      return idx === 0 || !path ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  return (
    <div className="space-y-6">
      {/* Symbol Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-dark-800 p-4 rounded-2xl border border-dark-700">
        <div className="flex items-center gap-3">
          <div className="font-mono text-xl font-bold text-white flex items-center gap-2">
            {selectedSymbol}
            {currentQuote && (
              <span className={`text-sm px-2 py-0.5 rounded ${currentQuote.change >= 0 ? 'bg-emerald-950/80 text-trade-green border border-emerald-800' : 'bg-red-950/80 text-trade-red border border-red-800'}`}>
                ${currentQuote.price.toFixed(2)} ({currentQuote.changePercent >= 0 ? '+' : ''}{currentQuote.changePercent.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>

        {/* Quick Ticker Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          {['NVDA', 'AAPL', 'TSLA', 'MSFT', 'BTC-USD', 'SPY'].map((sym) => (
            <button
              key={sym}
              onClick={() => onSelectSymbol(sym)}
              className={`px-3 py-1 text-xs rounded-lg border transition ${
                selectedSymbol === sym
                  ? 'bg-trade-green text-dark-900 border-trade-green font-bold'
                  : 'bg-dark-900 text-slate-300 border-dark-700 hover:border-slate-500'
              }`}
            >
              {sym}
            </button>
          ))}
          <button
            onClick={fetchData}
            title="Reload Chart & AI Model"
            className="p-1.5 bg-dark-900 hover:bg-dark-700 text-slate-400 hover:text-white rounded-lg border border-dark-700 ml-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Technical Chart & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Chart */}
        <div className="lg:col-span-2 bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold uppercase">Indicator Overlays:</span>
              <button
                onClick={() => setShowIndicators(p => ({ ...p, sma20: !p.sma20 }))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${showIndicators.sma20 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-dark-900 text-slate-500 border-dark-700'}`}
              >
                SMA 20
              </button>
              <button
                onClick={() => setShowIndicators(p => ({ ...p, ema9: !p.ema9 }))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${showIndicators.ema9 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-dark-900 text-slate-500 border-dark-700'}`}
              >
                EMA 9
              </button>
              <button
                onClick={() => setShowIndicators(p => ({ ...p, bollinger: !p.bollinger }))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${showIndicators.bollinger ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-dark-900 text-slate-500 border-dark-700'}`}
              >
                Bollinger Bands
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              60 Daily Candlesticks · Pandas Vectorized
            </div>
          </div>

          {/* SVG Candlestick Canvas */}
          <div className="bg-dark-900 rounded-xl p-3 border border-dark-700/80 overflow-x-auto relative">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                Calculating indicators with pandas & numpy...
              </div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[320px] font-mono select-none">
                {/* Horizontal Grid lines */}
                {[0.25, 0.5, 0.75].map((pct, i) => {
                  const yVal = minPrice + priceRange * pct;
                  const y = getY(yVal);
                  return (
                    <g key={i}>
                      <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#1F2430" strokeDasharray="3 3" />
                      <text x={chartWidth - padding.right + 4} y={y + 3} fill="#64748B" fontSize="9">
                        ${yVal.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Candlesticks */}
                {bars.map((b, i) => {
                  const isUp = b.close >= b.open;
                  const x = getX(i);
                  const yHigh = getY(b.high);
                  const yLow = getY(b.low);
                  const yOpen = getY(b.open);
                  const yClose = getY(b.close);
                  const top = Math.min(yOpen, yClose);
                  const height = Math.max(2, Math.abs(yClose - yOpen));
                  const candleWidth = Math.max(3, (chartWidth / bars.length) * 0.65);
                  const color = isUp ? '#00C076' : '#FF4D4F';

                  return (
                    <g key={i}>
                      {/* Wick */}
                      <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
                      {/* Real Body */}
                      <rect
                        x={x - candleWidth / 2}
                        y={top}
                        width={candleWidth}
                        height={height}
                        fill={color}
                        rx="1"
                      />
                    </g>
                  );
                })}

                {/* Overlays */}
                {showIndicators.sma20 && (
                  <path d={generateLinePath('sma_20')} fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.85" />
                )}
                {showIndicators.ema9 && (
                  <path d={generateLinePath('ema_9')} fill="none" stroke="#00F0FF" strokeWidth="1.5" strokeOpacity="0.85" />
                )}
                {showIndicators.bollinger && (
                  <>
                    <path d={generateLinePath('bb_upper')} fill="none" stroke="#A855F7" strokeWidth="1" strokeDasharray="2 2" />
                    <path d={generateLinePath('bb_lower')} fill="none" stroke="#A855F7" strokeWidth="1" strokeDasharray="2 2" />
                  </>
                )}
              </svg>
            )}
          </div>

          {/* Sub-panel: RSI Indicator */}
          {bars.length > 0 && bars[bars.length - 1].rsi_14 !== undefined && (
            <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/60 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-semibold">RSI (14):</span>
                <span className={`font-bold ${bars[bars.length - 1].rsi_14! < 30 ? 'text-trade-green' : bars[bars.length - 1].rsi_14! > 70 ? 'text-trade-red' : 'text-slate-200'}`}>
                  {bars[bars.length - 1].rsi_14!.toFixed(1)}
                </span>
                <span className="text-[11px] text-slate-500 font-sans">
                  {bars[bars.length - 1].rsi_14! < 30 ? '(Oversold / Bullish)' : bars[bars.length - 1].rsi_14! > 70 ? '(Overbought / Bearish)' : '(Neutral)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Support: 30 · Resistance: 70
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Trading Decision & Strategy Scorecard */}
        <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-dark-700/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-trade-green" />
                <h3 className="font-bold text-white text-sm">AI Trade Synthesis</h3>
              </div>
              <span className="text-[10px] font-mono uppercase bg-emerald-950/90 text-trade-green border border-emerald-800 px-2 py-0.5 rounded">
                Python Engine
              </span>
            </div>

            {signals ? (
              <div className="space-y-4 font-mono">
                {/* Action Card */}
                <div className="bg-dark-900 p-4 rounded-xl border border-dark-700/80 text-center">
                  <div className="text-[11px] text-slate-400 font-sans uppercase tracking-wider mb-1">
                    Algorithmic Recommendation
                  </div>
                  <div className={`text-2xl font-black tracking-tight ${
                    signals.action.includes('BUY') ? 'text-trade-green' : signals.action.includes('SELL') ? 'text-trade-red' : 'text-amber-400'
                  }`}>
                    {signals.action.replace('_', ' ')}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 font-sans">
                    Confidence: <span className="font-bold font-mono text-white">{signals.confidence}%</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
                    <span className="text-[11px] text-slate-400 font-sans block">Trend Direction</span>
                    <span className={`font-bold ${signals.trend === 'BULLISH' ? 'text-trade-green' : signals.trend === 'BEARISH' ? 'text-trade-red' : 'text-slate-200'}`}>
                      {signals.trend}
                    </span>
                  </div>
                  <div className="bg-dark-900/80 p-3 rounded-xl border border-dark-700/60">
                    <span className="text-[11px] text-slate-400 font-sans block">Momentum Score</span>
                    <span className="font-bold text-trade-cyan">
                      {signals.momentum_score > 0 ? '+' : ''}{signals.momentum_score.toFixed(0)} / 100
                    </span>
                  </div>
                </div>

                {/* Stop Loss & Take Profit Target */}
                <div className="bg-dark-900/80 p-3.5 rounded-xl border border-dark-700/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Suggested Stop-Loss (1.5x ATR):</span>
                    <span className="font-bold text-trade-red">${signals.stop_loss_suggested.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Suggested Take-Profit (3.0x ATR):</span>
                    <span className="font-bold text-trade-green">${signals.take_profit_suggested.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-dark-700/60 text-[11px]">
                    <span className="text-slate-400 font-sans">Risk / Reward Ratio:</span>
                    <span className="font-bold text-white">1 : {signals.risk_reward_ratio}</span>
                  </div>
                </div>

                {/* Analytical Rationales */}
                <div className="space-y-1.5 font-sans">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Synthesized Evidence:
                  </span>
                  {signals.reasons.map((r, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-dark-900/40 p-2 rounded-lg border border-dark-700/40">
                      <span className="text-trade-green mt-0.5">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs text-center py-8">
                Loading quantitative model...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
