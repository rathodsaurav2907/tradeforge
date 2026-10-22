import React, { useState } from 'react';
import { AlertOctagon, X, ShieldAlert, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface KillSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuted: () => void;
}

export const KillSwitchModal: React.FC<KillSwitchModalProps> = ({
  isOpen,
  onClose,
  onExecuted
}) => {
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setLoading(true);
    setResultMessage(null);
    try {
      const res = await api.triggerKillSwitch();
      setResultMessage(res.message);
      onExecuted();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dark-800 border-2 border-trade-red max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-dark-700 pb-3">
          <div className="flex items-center gap-2 text-trade-red">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
            <h3 className="font-bold text-white text-base">EMERGENCY KILL SWITCH</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {resultMessage ? (
          <div className="space-y-4 text-center py-2">
            <CheckCircle className="w-12 h-12 text-trade-green mx-auto" />
            <p className="text-xs font-mono text-slate-200 bg-dark-900 p-3 rounded-xl border border-dark-700">
              {resultMessage}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-950/40 border border-red-800/80 p-3.5 rounded-xl text-xs text-red-200 leading-relaxed">
              <strong className="block text-red-300 uppercase mb-1">Warning: Irreversible Action</strong>
              Triggering the Kill Switch will immediately:
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300">
                <li>Send <strong>MARKET SQUARE-OFF</strong> orders for all open live positions.</li>
                <li><strong>CANCEL ALL OPEN</strong> pending limit and stop orders.</li>
                <li><strong>LOCK</strong> the pre-trade risk engine against any new orders.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 bg-dark-900 text-slate-300 rounded-xl text-xs font-semibold border border-dark-700"
              >
                Abort
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={loading}
                className="px-5 py-2.5 bg-trade-red hover:bg-trade-redHover text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center gap-2"
              >
                {loading ? 'Flattening...' : 'Confirm & Flatten Everything'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
