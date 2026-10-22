import React, { useState, useEffect } from 'react';
import { Shield, Key, DollarSign, Sliders, CheckCircle2, Lock, Unlock, X } from 'lucide-react';
import { BrokerFunds, RiskSettings, formatINR, api } from '../services/api';

interface BrokerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const BrokerSettingsModal: React.FC<BrokerSettingsModalProps> = ({
  isOpen,
  onClose,
  onUpdated
}) => {
  const [broker, setBroker] = useState('ZERODHA');
  const [apiKey, setApiKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [clientId, setClientId] = useState('ZR001');
  const [funds, setFunds] = useState<BrokerFunds | null>(null);
  const [risk, setRisk] = useState<RiskSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [fRes, rRes] = await Promise.all([
        api.getBrokerFunds(),
        api.getRiskSettings()
      ]);
      setFunds(fRes);
      setRisk(rRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.connectBroker({
        broker,
        apiKey: apiKey || 'demo_kite_api_key',
        accessToken: accessToken || 'demo_kite_token',
        clientId
      });
      setMessage(res.message);
      await loadData();
      onUpdated();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockKillSwitch = async () => {
    try {
      await api.unlockKillSwitch();
      await loadData();
      onUpdated();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 max-w-xl w-full p-6 rounded-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-dark-700 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-trade-cyan" />
            <h3 className="font-bold text-white text-base">Broker Connection & Live Margins</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Broker Margin Telemetry */}
        {funds && (
          <div className="bg-dark-900 p-4 rounded-xl border border-dark-700/80 space-y-2">
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Live Broker Margin (₹ INR)
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-dark-800 p-2.5 rounded-lg border border-dark-700">
                <span className="text-[10px] text-slate-500 font-sans block">Available Margin</span>
                <span className="font-bold text-trade-green text-sm">{formatINR(funds.availableMargin)}</span>
              </div>
              <div className="bg-dark-800 p-2.5 rounded-lg border border-dark-700">
                <span className="text-[10px] text-slate-500 font-sans block">Used Margin</span>
                <span className="font-bold text-slate-200 text-sm">{formatINR(funds.usedMargin)}</span>
              </div>
              <div className="bg-dark-800 p-2.5 rounded-lg border border-dark-700">
                <span className="text-[10px] text-slate-500 font-sans block">Collateral Margin</span>
                <span className="font-bold text-trade-cyan text-sm">{formatINR(funds.collateral)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Kill Switch Lock Status */}
        {risk?.isKillSwitchLocked && (
          <div className="bg-red-950/70 border border-red-800 p-3 rounded-xl flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-trade-red shrink-0" />
              <span>Trading is currently LOCKED by Emergency Kill-Switch.</span>
            </div>
            <button
              onClick={handleUnlockKillSwitch}
              className="px-3 py-1 bg-dark-900 hover:bg-dark-700 text-trade-green border border-emerald-800 rounded-lg text-xs font-bold"
            >
              Unlock Circuit
            </button>
          </div>
        )}

        {/* Broker Credentials Form */}
        <form onSubmit={handleConnect} className="space-y-3.5">
          {message && (
            <div className="p-3 rounded-xl text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              {message}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 block mb-1">Select Broker Gateway</label>
            <select
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-trade-green font-mono"
            >
              <option value="ZERODHA">Zerodha Kite Connect v3 (Recommended for India)</option>
              <option value="DHAN">DhanHQ API (Zero Cost REST/WebSockets)</option>
              <option value="UPSTOX">Upstox API v2</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">API Key</label>
              <input
                type="password"
                placeholder="Paste API Key (or leave blank for Sandbox)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-trade-green font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Client ID</label>
              <input
                type="text"
                placeholder="e.g. ZR001"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-trade-green font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Session Access Token / Request Token</label>
            <input
              type="password"
              placeholder="Paste generated access token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-trade-green font-mono"
            />
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed">
            * Note: If you leave credentials blank or type "demo", TradeForge runs in verified Zerodha Kite Sandbox mode with simulated margin so you can safely test order routing.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-dark-900 text-slate-300 rounded-xl text-xs font-semibold border border-dark-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-trade-green hover:bg-trade-greenHover text-dark-900 font-bold rounded-xl text-xs"
            >
              {loading ? 'Connecting...' : 'Save & Connect Broker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
