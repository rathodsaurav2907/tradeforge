import React, { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Layers, 
  Briefcase, 
  Zap, 
  BookOpen, 
  RefreshCw,
  AlertOctagon,
  ShieldCheck,
  Radio,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { Quote, PortfolioSummary, BrokerStatus, formatINR } from '../services/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  quotes: Quote[];
  portfolio: PortfolioSummary | null;
  brokerStatus: BrokerStatus | null;
  onRefresh: () => void;
  onToggleMode: (mode: 'PAPER' | 'LIVE') => void;
  onOpenBrokerSettings: () => void;
  onOpenKillSwitch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  quotes,
  portfolio,
  brokerStatus,
  onRefresh,
  onToggleMode,
  onOpenBrokerSettings,
  onOpenKillSwitch
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'watchlist', label: 'Watchlists', icon: Layers },
    { id: 'charts', label: 'Charts & AI', icon: BarChart3 },
    { id: 'orders', label: 'Trading Desk', icon: Zap },
    { id: 'portfolio', label: 'Portfolio & Margin', icon: Briefcase },
    { id: 'journal', label: 'Trading Journal', icon: BookOpen },
  ];

  const isLive = brokerStatus?.mode === 'LIVE';

  return (
    <header className="border-b border-dark-700 bg-dark-900/95 sticky top-0 z-50 backdrop-blur">
      {/* Ticker Tape */}
      <div className="bg-dark-800 border-b border-dark-700/60 px-4 py-1.5 flex items-center overflow-x-auto whitespace-nowrap text-xs gap-6 text-slate-400 no-scrollbar">
        <span className="font-semibold text-trade-cyan flex items-center gap-1.5 tracking-wider uppercase text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-trade-green animate-ping inline-block" />
          NSE / BSE (15M) · INR
        </span>
        {quotes.map((q) => {
          const isPos = q.change >= 0;
          return (
            <div key={q.symbol} className="flex items-center gap-1.5 font-mono">
              <span className="font-bold text-slate-200">{q.symbol}</span>
              <span>{formatINR(q.price)}</span>
              <span className={isPos ? 'text-trade-green' : 'text-trade-red'}>
                {isPos ? '+' : ''}{q.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-trade-green via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-trade-green/20">
              <TrendingUp className="w-6 h-6 text-dark-900 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  TRADE<span className="text-trade-green">FORGE</span>
                </span>
                {/* Global Execution Mode Toggle Button */}
                <button
                  onClick={() => onToggleMode(isLive ? 'PAPER' : 'LIVE')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border flex items-center gap-1.5 transition ${
                    isLive 
                      ? 'bg-red-950 text-trade-red border-red-700 animate-pulse'
                      : 'bg-emerald-950/80 text-trade-green border-emerald-800'
                  }`}
                  title="Click to toggle between Paper Simulation and Live Brokerage"
                >
                  <Radio className="w-3 h-3" />
                  {isLive ? '🔴 LIVE BROKER' : '🟢 PAPER SIMULATOR'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {isLive ? 'Live Exchange Order Routing Active' : 'Zero-Risk Paper Trading Terminal'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-dark-700 text-white shadow-sm border border-slate-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-trade-green' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Actions: Broker Settings & Kill Switch */}
          <div className="flex items-center gap-2.5">
            {/* Broker Status Button */}
            <button
              onClick={onOpenBrokerSettings}
              className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-xs text-slate-300 border border-dark-700 rounded-xl flex items-center gap-1.5 transition font-mono"
              title="Configure Zerodha / Dhan Broker Connection"
            >
              <span className={`w-2 h-2 rounded-full ${brokerStatus?.connected ? 'bg-trade-green' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{brokerStatus?.brokerName || 'Zerodha Kite'}</span>
            </button>

            {/* Emergency Kill Switch Button */}
            <button
              onClick={onOpenKillSwitch}
              className="px-3 py-1.5 bg-red-950/90 hover:bg-red-900 text-trade-red border border-red-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Emergency: Flatten all positions and cancel all open orders"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">KILL SWITCH</span>
            </button>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              title="Refresh Stream"
              className="p-2 text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-xl border border-dark-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
