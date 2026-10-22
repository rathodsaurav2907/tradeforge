import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  RefreshCw,
  AlertTriangle 
} from 'lucide-react';
import { PortfolioSummary, LedgerEntry, formatINR, api } from '../services/api';

interface PortfolioProps {
  portfolio: PortfolioSummary | null;
  onRefresh: () => void;
  onSelectSymbol: (symbol: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({
  portfolio,
  onRefresh,
  onSelectSymbol,
  onNavigateTab
}) => {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'holdings' | 'ledger'>('holdings');

  const loadExtraData = async () => {
    try {
      const [ledgerRes, riskRes] = await Promise.all([
        api.getLedger(),
        api.getPortfolioRisk()
      ]);
      setLedger(ledgerRes);
      setRiskMetrics(riskRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExtraData();
  }, [portfolio]);

  return (
    <div className="space-y-6">
      {/* Simulation Disclaimer */}
      <div className="bg-dark-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Paper Portfolio: Denominated in INR (₹) · All holdings, cash balances, and ledger logs are 100% simulated.</span>
        </div>
        <span className="font-mono text-emerald-400 font-bold">Virtual Capital ₹10,00,000</span>
      </div>

      {/* Overview Cards in INR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Total Account Value</div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatINR(portfolio?.totalEquity || 1000000)}
          </div>
          <div className="text-xs text-slate-400 mt-2 font-mono">
            Cash: {formatINR(portfolio?.cashBalance || 1000000)}
          </div>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Unrealized P&L</div>
          <div className={`text-2xl font-bold font-mono ${portfolio && portfolio.unrealizedPnL >= 0 ? 'text-trade-green' : 'text-trade-red'}`}>
            {portfolio && portfolio.unrealizedPnL >= 0 ? '+' : ''}{formatINR(portfolio?.unrealizedPnL || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Active NSE equity positions
          </div>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Portfolio Sharpe</span>
            <Sparkles className="w-3.5 h-3.5 text-trade-green" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {riskMetrics?.portfolio_sharpe || '1.45'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Risk-adjusted return profile
          </div>
        </div>

        <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
          <div className="text-xs font-semibold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Estimated 1D VaR (95%)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-trade-cyan" />
          </div>
          <div className="text-2xl font-bold font-mono text-trade-cyan">
            {formatINR(riskMetrics?.estimated_var_95 || 4500)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Parametric value-at-risk
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Holdings vs Ledger */}
      <div className="bg-dark-800 p-5 rounded-2xl border border-dark-700">
        <div className="flex items-center justify-between border-b border-dark-700/80 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('holdings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'holdings'
                  ? 'bg-dark-700 text-white shadow-sm border border-slate-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Holdings ({portfolio?.positions.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'ledger'
                  ? 'bg-dark-700 text-white shadow-sm border border-slate-600/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Double-Entry Ledger Audit ({ledger.length})
            </button>
          </div>

          <button
            onClick={() => {
              onRefresh();
              loadExtraData();
            }}
            className="p-1.5 bg-dark-900 hover:bg-dark-700 rounded-lg text-slate-400 hover:text-white border border-dark-700 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>

        {/* Sub-tab: Holdings */}
        {activeSubTab === 'holdings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono">
              <thead className="bg-dark-900/80 text-[10px] font-sans font-semibold uppercase text-slate-400 border-b border-dark-700">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4 text-right">Shares / Qty</th>
                  <th className="py-3 px-4 text-right">Avg Buy Price</th>
                  <th className="py-3 px-4 text-right">Current Price</th>
                  <th className="py-3 px-4 text-right">Market Value</th>
                  <th className="py-3 px-4 text-right">Unrealized P&L</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                {!portfolio?.positions || portfolio.positions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      No active holdings. Go to Paper Orders to open simulated positions!
                    </td>
                  </tr>
                ) : (
                  portfolio.positions.map((pos) => {
                    const isPos = pos.unrealizedPnL >= 0;
                    return (
                      <tr key={pos.symbol} className="hover:bg-dark-700/40">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          {pos.symbol}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-200">{pos.quantity}</td>
                        <td className="py-3.5 px-4 text-right text-slate-300">{formatINR(pos.avgEntryPrice)}</td>
                        <td className="py-3.5 px-4 text-right text-white font-bold">{formatINR(pos.currentPrice)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                          {formatINR(pos.marketValue)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`font-bold ${isPos ? 'text-trade-green' : 'text-trade-red'}`}>
                            {isPos ? '+' : ''}{formatINR(pos.unrealizedPnL)}
                          </span>
                          <span className={`text-xs ml-1 ${isPos ? 'text-trade-green' : 'text-trade-red'}`}>
                            ({isPos ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              onSelectSymbol(pos.symbol);
                              onNavigateTab('orders');
                            }}
                            className="px-2.5 py-1 bg-dark-700 hover:bg-dark-600 text-xs font-sans text-slate-200 rounded-lg border border-slate-600 transition"
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab: Ledger */}
        {activeSubTab === 'ledger' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-dark-900/80 text-[10px] font-sans font-semibold uppercase text-slate-400 border-b border-dark-700">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Entry Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/60">
                {ledger.map((entry) => {
                  const isCredit = entry.amount >= 0;
                  return (
                    <tr key={entry.id} className="hover:bg-dark-700/40">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-300">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          entry.entry_type === 'DEPOSIT' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                          entry.entry_type === 'BUY_ORDER' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {entry.entry_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-sans">{entry.description}</td>
                      <td className={`py-3 px-4 text-right font-bold ${isCredit ? 'text-trade-green' : 'text-trade-red'}`}>
                        {isCredit ? '+' : ''}{formatINR(Math.abs(entry.amount))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-100">
                        {formatINR(entry.balance_after)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
