import React from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Check,
  Flame,
  BellRing,
} from 'lucide-react';
import { DailyCommitment } from '../types.ts';
import { playCheckmarkSound } from '../utils/audioAlert.ts';

interface DailyCommitmentsCardProps {
  commitments: DailyCommitment[];
  onToggleComplete: (id: string) => void;
  onOpenAgenda: () => void;
  onOpenNewModal: (type?: 'emergency' | 'appointment' | 'task') => void;
}

export const DailyCommitmentsCard: React.FC<DailyCommitmentsCardProps> = ({
  commitments,
  onToggleComplete,
  onOpenAgenda,
  onOpenNewModal,
}) => {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayStr();
  const todayItems = commitments.filter((c) => c.date === todayStr);
  const pendingItems = todayItems.filter((c) => !c.completed);
  const completedCount = todayItems.filter((c) => c.completed).length;
  const emergencies = todayItems.filter((c) => c.type === 'emergency' && !c.completed);

  const handleCheck = (comm: DailyCommitment) => {
    if (!comm.completed) {
      playCheckmarkSound();
    }
    onToggleComplete(comm.id);
  };

  return (
    <div
      id="daily-commitments-card"
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Socorros do Dia & Compromissos de Hoje
              </h3>
              {emergencies.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 animate-pulse">
                  {emergencies.length} Urgência(s)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Válvula de escape diária: dê o visto nas tarefas e socorros que já fez hoje.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenNewModal('emergency')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>+ Socorro</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewModal('appointment')}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Compromisso</span>
          </button>
          <button
            type="button"
            onClick={onOpenAgenda}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Agenda Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress mini indicator */}
      {todayItems.length > 0 && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">
            Progresso de Hoje: <strong className="text-slate-900">{completedCount}</strong> de{' '}
            <strong className="text-slate-900">{todayItems.length}</strong> concluídos
          </span>
          <span className="text-emerald-700 font-bold">
            {Math.round((completedCount / todayItems.length) * 100)}% com visto ✓
          </span>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {todayItems.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs">Nenhum socorro ou compromisso anotado para hoje.</p>
            <button
              type="button"
              onClick={() => onOpenNewModal('emergency')}
              className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
            >
              + Anotar o primeiro socorro do dia agora
            </button>
          </div>
        ) : (
          todayItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                item.completed
                  ? 'bg-slate-50/70 border-slate-200 opacity-75'
                  : item.type === 'emergency'
                  ? 'bg-rose-50/40 border-rose-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => handleCheck(item)}
                  title={item.completed ? 'Clique para desmarcar' : 'Clique para dar visto (feito!)'}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer ${
                    item.completed
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${item.completed ? 'stroke-[3]' : ''}`} />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold truncate ${
                        item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.type === 'emergency' && !item.completed && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 shrink-0">
                        Socorro
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    {item.time && (
                      <span className="flex items-center gap-0.5 font-bold text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.time}
                      </span>
                    )}
                    {item.soundEnabled && !item.completed && (
                      <span className="text-amber-600 flex items-center gap-0.5">
                        <BellRing className="w-2.5 h-2.5" />
                        Apita {item.soundAlertMinutesBefore ?? 0}m antes
                      </span>
                    )}
                    {item.completed && (
                      <span className="text-emerald-600 font-medium">✓ Feito</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCheck(item)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition-colors cursor-pointer ${
                  item.completed
                    ? 'text-slate-500 hover:bg-slate-200'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {item.completed ? 'Desmarcar' : 'Dar Visto ✓'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
