import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Watchlist } from './pages/Watchlist';
import { Charts } from './pages/Charts';
import { PaperOrders } from './pages/PaperOrders';
import { Portfolio } from './pages/Portfolio';
import { Journal } from './pages/Journal';
import { Quote, PortfolioSummary, api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGlobalData = async () => {
    try {
      const [quotesRes, portfolioRes] = await Promise.all([
        api.getQuotes(),
        api.getPortfolioSummary()
      ]);
      setQuotes(quotesRes);
      setPortfolio(portfolioRes);
    } catch (err) {
      console.error('Failed to load live data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    // Poll mock stream every 3.5 seconds
    const interval = setInterval(fetchGlobalData, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        quotes={quotes}
        portfolio={portfolio}
        onRefresh={fetchGlobalData}
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

      {/* Footer with Compliance Notice */}
      <footer className="border-t border-dark-800 bg-dark-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">TradeForge</span>
              <span>·</span>
              <span>AI-Enhanced Paper Trading Terminal (NSE / BSE INR)</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span>React + Vite</span>
              <span>·</span>
              <span>Node.js Express + Prisma</span>
              <span>·</span>
              <span>Python Poetry (Pandas & NumPy)</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 text-center sm:text-left leading-relaxed">
            * Disclaimer: All market quotes are 15-minute delayed or simulated from permitted educational data feeds. All balances (₹10,00,000 INR starting capital), trades, and performance metrics are strictly virtual with no real financial liability. TradeForge is an educational technology demonstration.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
