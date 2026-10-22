import React from 'react';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Layers, 
  Briefcase, 
  Zap, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { Quote, PortfolioSummary } from '../services/api';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  quotes: Quote[];
  portfolio: PortfolioSummary | null;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  quotes,
  portfolio,
  onRefresh
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'watchlist', label: 'Watchlist', icon: Layers },
    { id: 'charts', label: 'Charts & Indicators', icon: BarChart3 },
    { id: 'orders', label: 'Paper Orders', icon: Zap },
    { id: 'portfolio', label: 'Portfolio & Ledger', icon: Briefcase },
  ];

  return (
    <header className="border-b border-dark-700 bg-dark-900/95 sticky top-0 z-50 backdrop-blur">
      {/* Ticker Tape */}
      <div className="bg-dark-800 border-b border-dark-700/60 px-4 py-1.5 flex items-center overflow-x-auto whitespace-nowrap text-xs gap-6 text-slate-400 no-scrollbar">
        <span className="font-semibold text-trade-cyan flex items-center gap-1.5 tracking-wider uppercase text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-trade-green animate-ping inline-block" />
          Live Mock Stream
        </span>
        {quotes.map((q) => {
          const isPos = q.change >= 0;
          return (
            <div key={q.symbol} className="flex items-center gap-2 font-mono">
              <span className="font-bold text-slate-200">{q.symbol}</span>
              <span>${q.price.toFixed(2)}</span>
              <span className={isPos ? 'text-trade-green' : 'text-trade-red'}>
                {isPos ? '+' : ''}{q.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-trade-green via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-trade-green/20">
              <TrendingUp className="w-6 h-6 text-dark-900 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  TRADE<span className="text-trade-green">FORGE</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-950/80 text-trade-green border border-emerald-800 rounded">
                  PAPER AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Algorithmic & Simulated Trading Terminal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-dark-700 text-white shadow-sm border border-slate-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-trade-green' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* User Portfolio Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              title="Refresh Data"
              className="p-2 text-slate-400 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg border border-dark-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="bg-dark-800 px-3.5 py-1.5 rounded-xl border border-dark-700 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Paper Account Equity
              </div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                ${portfolio ? portfolio.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '100,000.00'}
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-dark-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-trade-green">
              AT
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
