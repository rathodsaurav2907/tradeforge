import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Activity,
  Sliders,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Bar, AISignals, Quote, formatINR, api } from '../services/api';

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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const [bars, setBars] = useState<Bar[]>([]);
  const [signals, setSignals] = useState<AISignals | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIndicators, setShowIndicators] = useState({
    sma20: true,
    ema9: true,
    bollinger: false,
    stochastic: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
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

  useEffect(() => {
    if (!chartContainerRef.current || bars.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E14' },
        textColor: '#94A3B8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace"
      },
      grid: {
        vertLines: { color: '#1F2430' },
        horzLines: { color: '#1F2430' }
      },
      crosshair: {
        vertLine: { color: '#00F0FF', width: 1, style: 3 },
        horzLine: { color: '#00F0FF', width: 1, style: 3 }
      },
      timeScale: {
        borderColor: '#2A3142',
        timeVisible: true
      },
      rightPriceScale: {
        borderColor: '#2A3142'
      }
    });

    chartInstanceRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00C076',
      downColor: '#FF4D4F',
      borderVisible: false,
      wickUpColor: '#00C076',
      wickDownColor: '#FF4D4F'
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    });

    const formattedCandles = bars.map((b) => ({
      time: b.timestamp.split('T')[0],
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close
    }));

    const formattedVolume = bars.map((b) => ({
      time: b.timestamp.split('T')[0],
      value: b.volume,
      color: b.close >= b.open ? 'rgba(0, 192, 118, 0.25)' : 'rgba(255, 77, 79, 0.25)'
    }));

    candleSeries.setData(formattedCandles);
    volumeSeries.setData(formattedVolume);

    if (showIndicators.sma20) {
      const smaSeries = chart.addLineSeries({
        color: '#F59E0B',
        lineWidth: 2,
        title: 'SMA 20'
      });
      const smaData = bars
        .filter((b) => b.sma_20 !== undefined && b.sma_20 !== null)
        .map((b) => ({ time: b.timestamp.split('T')[0], value: b.sma_20! }));
      smaSeries.setData(smaData);
    }

    if (showIndicators.ema9) {
      const emaSeries = chart.addLineSeries({
        color: '#00F0FF',
        lineWidth: 2,
        title: 'EMA 9'
      });
      const emaData = bars
        .filter((b) => b.ema_9 !== undefined && b.ema_9 !== null)
        .map((b) => ({ time: b.timestamp.split('T')[0], value: b.ema_9! }));
      emaSeries.setData(emaData);
    }

    if (showIndicators.bollinger) {
      const upperSeries = chart.addLineSeries({
        color: '#A855F7',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Upper'
      });
      const lowerSeries = chart.addLineSeries({
        color: '#A855F7',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Lower'
      });

      const upperData = bars
        .filter((b) => b.bb_upper !== undefined && b.bb_upper !== null)
        .map((b) => ({ time: b.timestamp.split('T')[0], value: b.bb_upper! }));
      const lowerData = bars
        .filter((b) => b.bb_lower !== undefined && b.bb_lower !== null)
        .map((b) => ({ time: b.timestamp.split('T')[0], value: b.bb_lower! }));

      upperSeries.setData(upperData);
      lowerSeries.setData(lowerData);
    }

    if (showIndicators.stochastic) {
      const kSeries = chart.addLineSeries({
        color: '#22C55E',
        lineWidth: 1.5,
        title: 'Stoch %K'
      });
      const dSeries = chart.addLineSeries({
        color: '#F59E0B',
        lineWidth: 1.5,
        title: 'Stoch %D'
      });

      const kData = bars
        .filter((b) => b.stoch_k !== undefined && b.stoch_k !== null)
        .map((b) => ({ time: b.timestamp.split('T')[0], value: b.stoch_k! }));
      const dData = bars
        .filter((b) => b.stoch_d !== undefined && b.stoch_d !== null)
        .map((b) => ({ time: b.timestamp.split('T')[0], value: b.stoch_d! }));

      kSeries.setData(kData);
      dSeries.setData(dData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [bars, showIndicators]);

  const currentQuote = quotes.find(q => q.symbol === selectedSymbol);

  return (
    <div className="space-y-6">
      <div className="bg-dark-800/80 border border-slate-700/60 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-trade-green" />
          <span>Market Data: Permitted educational stream · 15-minute delayed quotes · Prices in Indian Rupee (INR ₹)</span>
        </div>
        <span className="text-[10px] bg-dark-900 border border-dark-700 px-2 py-0.5 rounded text-trade-cyan font-mono">
          TradingView Lightweight Charts v4
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-dark-800 p-4 rounded-2xl border border-dark-700">
        <div className="flex items-center gap-3">
          <div className="font-mono text-xl font-bold text-white flex items-center gap-2">
            {selectedSymbol}
            {currentQuote && (
              <span className={`text-sm px-2 py-0.5 rounded ${currentQuote.change >= 0 ? 'bg-emerald-950/80 text-trade-green border border-emerald-800' : 'bg-red-950/80 text-trade-red border border-red-800'}`}>
                {formatINR(currentQuote.price)} ({currentQuote.changePercent >= 0 ? '+' : ''}{currentQuote.changePercent.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS', 'SBIN', 'NIFTY50'].map((sym) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-dark-800 p-5 rounded-2xl border border-dark-700 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold uppercase">TradingView Overlays:</span>
              <button
                onClick={() => setShowIndicators(p => ({ ...p, sma20: !p.sma20 }))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${showIndicators.sma20 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-dark-900 text-slate-500 border-dark-700'}`}>
                SMA 20
              </button>
              <button
                onClick={() => setShowIndicators(p => ({ ...p, ema9: !p.ema9 }))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${showIndicators.ema9 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-dark-900 text-slate-500 border-dark-700'}`}>
                EMA 9
              </button>
              <button
                onClick={() => setShowIndicators(p => ({ ...p, bollinger: !p.bollinger }))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${showIndicators.bollinger ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-dark-900 text-slate-500 border-dark-700'}`}>
                Bollinger Bands
              </button>
              <button
                onClick={() => setShowIndicators(p => ({ ...p, stochastic: !p.stochastic }))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${showIndicators.stochastic ? 'bg-green-500/20 text-green-300 border-green-500/40' : 'bg-dark-900 text-slate-500 border-dark-700'}`}>
                Stochastic
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-trade-green inline-block" />
              Interactive Daily Candles (₹ INR)
            </div>
          </div>

          <div className="bg-dark-900 rounded-xl p-2 border border-dark-700/80 overflow-hidden relative min-h-[380px]">
            {loading && (
              <div className="absolute inset-0 z-10 bg-dark-900/80 flex items-center justify-center text-slate-400 text-xs">
                Calculating indicators with pandas & numpy...
              </div>
            )}
            <div ref={chartContainerRef} className="w-full h-[380px]" />
          </div>

          {bars.length > 0 && bars[bars.length - 1].rsi_14 !== undefined && (
            <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/60 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-semibold">RSI (14):</span>
                <span className={`font-bold ${bars[bars.length - 1].rsi_14! < 30 ? 'text-trade-green' : bars[bars.length - 1].rsi_14! > 70 ? 'text-trade-red' : 'text-slate-200'}`}>
                  {bars[bars.length - 1].rsi_14!.toFixed(1)}
                </span>
                <span className="text-[11px] text-slate-500 font-sans">
                  {bars[bars.length - 1].rsi_14! < 30 ? '(Oversold / Bullish Bounce)' : bars[bars.length - 1].rsi_14! > 70 ? '(Overbought / Bearish)' : '(Neutral Consolidation)'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Support: 30 · Resistance: 70
              </div>
            </div>
          )}
        </div>

        <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between border-b border-dark-700/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-trade-green" />
                <h3 className="font-bold text-white text-sm">AI Trade Synthesis</h3>
              </div>
              <span className="text-[10px] font-mono uppercase bg-emerald-950/90 text-trade-green border border-emerald-800 px-2 py-0.5 rounded">
                Pandas & NumPy
              </span>
            </div>

            {signals ? (
              <div className="space-y-4 font-mono">
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

                <div className="bg-dark-900/80 p-3.5 rounded-xl border border-dark-700/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Suggested Stop-Loss (1.5x ATR):</span>
                    <span className="font-bold text-trade-red">{formatINR(signals.stop_loss_suggested)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-sans">Suggested Take-Profit (3.0x ATR):</span>
                    <span className="font-bold text-trade-green">{formatINR(signals.take_profit_suggested)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-dark-700/60 text-[11px]">
                    <span className="text-slate-400 font-sans">Risk / Reward Ratio:</span>
                    <span className="font-bold text-white">1 : {signals.risk_reward_ratio}</span>
                  </div>
                </div>

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
