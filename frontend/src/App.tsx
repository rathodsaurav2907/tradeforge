import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Watchlist } from './pages/Watchlist';
import { Charts } from './pages/Charts';
import { PaperOrders } from './pages/PaperOrders';
import { Portfolio } from './pages/Portfolio';
import { Quote, PortfolioSummary, api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
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
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-800 bg-dark-900 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">TradeForge</span>
            <span>·</span>
            <span>AI-Enhanced Paper Trading Terminal</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>React + Vite</span>
            <span>·</span>
            <span>Node.js Express</span>
            <span>·</span>
            <span>PostgreSQL</span>
            <span>·</span>
            <span>Python Pandas & NumPy</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
