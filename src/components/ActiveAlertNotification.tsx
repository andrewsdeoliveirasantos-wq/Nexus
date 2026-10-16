import React from 'react';
import { BellRing, Check, Clock, AlertTriangle, X } from 'lucide-react';
import { DailyCommitment } from '../types.ts';

interface ActiveAlertNotificationProps {
  commitment: DailyCommitment | null;
  onDismiss: () => void;
  onMarkAsDone: (id: string) => void;
  onSnooze5Min: (id: string) => void;
}

export const ActiveAlertNotification: React.FC<ActiveAlertNotificationProps> = ({
  commitment,
  onDismiss,
  onMarkAsDone,
  onSnooze5Min,
}) => {
  if (!commitment) return null;

  const isEmergency = commitment.type === 'emergency' || commitment.priority === 'urgent';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 animate-in slide-in-from-bottom-5 duration-300">
      <div
        id="active-alert-card"
        className={`rounded-2xl p-4 shadow-2xl border-2 backdrop-blur-md ${
          isEmergency
            ? 'bg-rose-950/90 text-white border-rose-500 shadow-rose-900/40'
            : 'bg-slate-900/95 text-white border-indigo-500 shadow-indigo-950/50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center animate-bounce ${
                isEmergency ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
              }`}
            >
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isEmergency ? 'bg-rose-700 text-rose-100' : 'bg-indigo-700 text-indigo-100'
                  }`}
                >
                  {isEmergency ? '🚨 ALARME: SOCORRO DO DIA' : '⏰ ALERTA DE COMPROMISSO'}
                </span>
                {commitment.time && (
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {commitment.time}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold mt-1 text-white leading-tight">
                {commitment.title}
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {commitment.notes && (
          <p className="text-xs text-slate-300 mt-2 pl-12 line-clamp-2">
            {commitment.notes}
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => onSnooze5Min(commitment.id)}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            Adiar 5 min
          </button>
          <button
            type="button"
            onClick={() => onMarkAsDone(commitment.id)}
            className="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Dar Visto (Concluído)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
