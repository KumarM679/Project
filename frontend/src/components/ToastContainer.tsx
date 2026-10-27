import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications, removeToast } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {notifications.map((toast) => {
        const icons = {
          info: <Info className="w-5 h-5 text-teal-600 flex-shrink-0" />,
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
        };

        const bg = {
          info: 'bg-white border-teal-200 text-slate-800 shadow-teal-900/5',
          success: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-900/5',
          warning: 'bg-white border-amber-200 text-slate-800 shadow-amber-900/5',
          error: 'bg-white border-rose-200 text-slate-800 shadow-rose-900/5',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all transform translate-y-0 ${
              bg[toast.type]
            }`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-sm">
              <p className="font-medium text-slate-900 leading-snug">{toast.message}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{toast.timestamp}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
