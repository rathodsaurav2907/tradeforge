import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Watchlist } from './pages/Watchlist';
import { Charts } from './pages/Charts';
import { PaperOrders } from './pages/PaperOrders';
import { Portfolio } from './pages/Portfolio';
import { Journal } from './pages/Journal';
import { KillSwitchModal } from './components/KillSwitchModal';
import { BrokerSettingsModal } from './components/BrokerSettingsModal';
import { Quote, PortfolioSummary, BrokerStatus, api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [brokerStatus, setBrokerStatus] = useState<BrokerStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showKillSwitch, setShowKillSwitch] = useState<boolean>(false);
  const [showBrokerSettings, setShowBrokerSettings] = useState<boolean>(false);

  const fetchGlobalData = async () => {
    try {
      const [quotesRes, portfolioRes, brokerRes] = await Promise.all([
        api.getQuotes(),
        api.getPortfolioSummary(),
        api.getBrokerStatus()
      ]);
      setQuotes(quotesRes);
      setPortfolio(portfolioRes);
      setBrokerStatus(brokerRes);
    } catch (err) {
      console.error('Failed to load live data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMode = async (newMode: 'PAPER' | 'LIVE') => {
    try {
      const res = await api.setBrokerMode(newMode);
      setBrokerStatus(prev => prev ? { ...prev, mode: res.mode } : null);
      await fetchGlobalData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const currentMode = brokerStatus?.mode || 'PAPER';

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        quotes={quotes}
        portfolio={portfolio}
        brokerStatus={brokerStatus}
        onRefresh={fetchGlobalData}
        onToggleMode={handleToggleMode}
        onOpenBrokerSettings={() => setShowBrokerSettings(true)}
        onOpenKillSwitch={() => setShowKillSwitch(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            portfolio={portfolio}
            quotes={quotes}
            onSelectSymbol={setSelectedSymbol}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist
            quotes={quotes}
            onSelectSymbol={setSelectedSymbol}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'charts' && (
          <Charts
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            quotes={quotes}
          />
        )}

        {activeTab === 'orders' && (
          <PaperOrders
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            quotes={quotes}
            portfolio={portfolio}
            mode={currentMode}
            onOrderPlaced={fetchGlobalData}
          />
        )}

        {activeTab === 'portfolio' && (
          <Portfolio
            portfolio={portfolio}
            onRefresh={fetchGlobalData}
            onSelectSymbol={setSelectedSymbol}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'journal' && (
          <Journal />
        )}
      </main>

      {/* Modals */}
      <KillSwitchModal
        isOpen={showKillSwitch}
        onClose={() => setShowKillSwitch(false)}
        onExecuted={fetchGlobalData}
      />

      <BrokerSettingsModal
        isOpen={showBrokerSettings}
        onClose={() => setShowBrokerSettings(false)}
        onUpdated={fetchGlobalData}
      />

      {/* Footer */}
      <footer className="border-t border-dark-800 bg-dark-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">TradeForge</span>
              <span>·</span>
              <span>Institutional Algorithmic & Live Brokerage Terminal</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-dark-800 border border-slate-700 text-trade-cyan font-mono">
                {currentMode === 'LIVE' ? '🔴 LIVE BROKER' : '🟢 PAPER SIMULATION'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span>Zerodha Kite Connect v3</span>
              <span>·</span>
              <span>Pre-Trade Risk Engine</span>
              <span>·</span>
              <span>Emergency Kill Switch</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 text-center sm:text-left leading-relaxed">
            * Live trading involves risk of capital loss. TradeForge enforces automated pre-trade risk controls (max ₹1,00,000 order ceiling, max daily loss limit, and emergency one-click kill-switch).
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
