import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  Check,
  Award,
  Zap,
} from 'lucide-react';
import { GoalItem, GoalTimeframe, CoupleMember } from '../types.ts';
import { formatCurrency, formatDateBR } from '../utils/formatters.ts';
import { playCheckmarkSound } from '../utils/audioAlert.ts';

interface ObjectivesViewProps {
  goals: GoalItem[];
  onToggleGoal: (id: string) => void;
  onOpenNewGoalModal: (defaultTimeframe?: GoalTimeframe) => void;
  onEditGoal: (goal: GoalItem) => void;
  onDeleteGoal: (id: string) => void;
  activeProfile?: CoupleMember;
}

export const ObjectivesView: React.FC<ObjectivesViewProps> = ({
  goals,
  onToggleGoal,
  onOpenNewGoalModal,
  onEditGoal,
  onDeleteGoal,
  activeProfile = 'andrews',
}) => {
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | GoalTimeframe>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [memberFilter, setMemberFilter] = useState<'all' | 'andrews' | 'rayssa'>('all');
  const [goalToDelete, setGoalToDelete] = useState<GoalItem | null>(null);

  const handleToggleWithAudio = (goal: GoalItem) => {
    if (!goal.completed) {
      playCheckmarkSound();
    }
    onToggleGoal(goal.id);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.completed).length;
    const pending = total - completed;

    const weekly = goals.filter((g) => g.timeframe === 'weekly');
    const monthly = goals.filter((g) => g.timeframe === 'monthly');
    const yearly = goals.filter((g) => g.timeframe === 'yearly');

    const weeklyPending = weekly.filter((g) => !g.completed).length;
    const monthlyPending = monthly.filter((g) => !g.completed).length;
    const yearlyPending = yearly.filter((g) => !g.completed).length;

    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      weeklyTotal: weekly.length,
      weeklyPending,
      monthlyTotal: monthly.length,
      monthlyPending,
      yearlyTotal: yearly.length,
      yearlyPending,
      progressPercent,
    };
  }, [goals]);

  // Filtered list
  const filteredGoals = useMemo(() => {
    return goals
      .filter((g) => {
        if (timeframeFilter !== 'all' && g.timeframe !== timeframeFilter) return false;
        if (statusFilter === 'pending' && g.completed) return false;
        if (statusFilter === 'completed' && !g.completed) return false;
        if (memberFilter === 'andrews') {
          const isAndrews = g.member === 'andrews' || g.title.toLowerCase().includes('andrews');
          if (!isAndrews && g.member !== 'both') return false;
        } else if (memberFilter === 'rayssa') {
          const isRayssa = g.member === 'rayssa' || g.title.toLowerCase().includes('rayssa');
          if (!isRayssa && g.member !== 'both') return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pending first
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // Weekly -> Monthly -> Yearly
        const order: Record<GoalTimeframe, number> = { weekly: 1, monthly: 2, yearly: 3 };
        if (order[a.timeframe] !== order[b.timeframe]) {
          return order[a.timeframe] - order[b.timeframe];
        }
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
  }, [goals, timeframeFilter, statusFilter, memberFilter]);

  const getTimeframeBadge = (tf: GoalTimeframe) => {
    switch (tf) {
      case 'weekly':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Zap className="w-3 h-3 text-blue-600" />
            <span>Semanal</span>
          </span>
        );
      case 'monthly':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Calendar className="w-3 h-3 text-purple-600" />
            <span>Mensal</span>
          </span>
        );
      case 'yearly':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <Award className="w-3 h-3 text-amber-600" />
            <span>Meta do Ano</span>
          </span>
        );
    }
  };

  const getMemberBadge = (member?: CoupleMember) => {
    if (member === 'andrews') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100/70 text-blue-800">
          <span>👨‍💼</span>
          <span>Andrews</span>
        </span>
      );
    }
    if (member === 'rayssa') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100/70 text-purple-800">
          <span>👩‍💼</span>
          <span>Rayssa</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/70 text-emerald-800">
        <span>👫</span>
        <span>Casal</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold mb-2.5 border border-amber-200">
              <Target className="w-4 h-4 text-amber-600" />
              <span>Metas & Objetivos do Casal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Planejamento de Objetivos
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              Escreva e acompanhe os objetivos que vocês desejam cumprir nesta semana, no mês ou durante o ano (ex: <strong>arrumar o carro</strong>, <strong>comprar um tênis</strong>, <strong>construir um muro</strong>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenNewGoalModal('weekly')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Meta Semanal</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenNewGoalModal('monthly')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>+ Meta Mensal</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenNewGoalModal('yearly')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>+ Meta do Ano</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ⚡ Esta Semana
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {stats.weeklyPending} a fazer
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {stats.weeklyTotal}
            </div>
            <span className="text-[11px] text-slate-400">Objetivo(s) da semana</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                🗓️ Deste Mês
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                {stats.monthlyPending} a fazer
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {stats.monthlyTotal}
            </div>
            <span className="text-[11px] text-slate-400">Objetivo(s) no mês</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                🏆 Meta do Ano
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                {stats.yearlyPending} a fazer
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {stats.yearlyTotal}
            </div>
            <span className="text-[11px] text-slate-400">Grandes metas 2026</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Concluídos
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {stats.progressPercent}%
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              {stats.completed} <span className="text-xs font-normal text-slate-400">/ {stats.total}</span>
            </div>
            {/* Mini progress bar */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Timeframe Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Período:
          </span>
          <button
            type="button"
            onClick={() => setTimeframeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTimeframeFilter('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframeFilter === 'weekly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            ⚡ Semanais ({stats.weeklyTotal})
          </button>
          <button
            type="button"
            onClick={() => setTimeframeFilter('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframeFilter === 'monthly'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            🗓️ Mensais ({stats.monthlyTotal})
          </button>
          <button
            type="button"
            onClick={() => setTimeframeFilter('yearly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeframeFilter === 'yearly'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            🏆 Anuais ({stats.yearlyTotal})
          </button>
        </div>

        {/* Member and Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Member selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setMemberFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                memberFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👫 Ambos
            </button>
            <button
              type="button"
              onClick={() => setMemberFilter('andrews')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                memberFilter === 'andrews' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👨‍💼 Andrews
            </button>
            <button
              type="button"
              onClick={() => setMemberFilter('rayssa')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                memberFilter === 'rayssa' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👩‍💼 Rayssa
            </button>
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Status: Todos</option>
            <option value="pending">Apenas Pendentes</option>
            <option value="completed">Apenas Concluídos</option>
          </select>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {filteredGoals.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
            <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-xs">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Nenhum objetivo encontrado neste filtro
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Adicione suas metas para não esquecer nada importante. Você pode planejar desde pequenos afazeres da semana até grandes conquistas do ano.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onOpenNewGoalModal('weekly')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
              >
                + Arrumar o carro (Semanal)
              </button>
              <button
                type="button"
                onClick={() => onOpenNewGoalModal('monthly')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
              >
                + Comprar um tênis (Mensal)
              </button>
              <button
                type="button"
                onClick={() => onOpenNewGoalModal('yearly')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-colors cursor-pointer"
              >
                + Construir um muro (Anual)
              </button>
            </div>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const hasFinancials = goal.targetAmount && goal.targetAmount > 0;
            const saved = goal.savedAmount || 0;
            const target = goal.targetAmount || 0;
            const financialPercent = hasFinancials ? Math.min(100, Math.round((saved / target) * 100)) : 0;

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  goal.completed
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                    : goal.timeframe === 'yearly'
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left side: Checkbox + Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Interactive Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleWithAudio(goal)}
                    title={goal.completed ? 'Marcar como não concluído' : 'Marcar como concluído!'}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      goal.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 text-transparent hover:text-emerald-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {getTimeframeBadge(goal.timeframe)}
                      {getMemberBadge(goal.member)}
                      {goal.category && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {goal.category}
                        </span>
                      )}
                      {goal.targetDate && (
                        <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Prazo: {formatDateBR(goal.targetDate)}</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4
                      className={`text-base font-bold tracking-tight text-slate-900 ${
                        goal.completed ? 'line-through text-slate-400 font-medium' : ''
                      }`}
                    >
                      {goal.title}
                    </h4>

                    {/* Notes if any */}
                    {goal.notes && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {goal.notes}
                      </p>
                    )}

                    {/* Financial Progress if set */}
                    {hasFinancials && (
                      <div className="mt-2.5 max-w-md bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-amber-600" />
                            Progresso Financeiro:
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(saved)} de {formatCurrency(target)} ({financialPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              financialPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${financialPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleWithAudio(goal)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      goal.completed
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {goal.completed ? 'Desmarcar' : 'Cumprir ✓'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditGoal(goal)}
                    title="Editar objetivo"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setGoalToDelete(goal)}
                    title="Excluir objetivo"
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmação para Excluir Objetivo */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 p-6 text-center animate-scaleIn">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-2xs">
              <Trash2 className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Excluir este Objetivo?
            </h3>
            <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
              Tem certeza que deseja apagar o objetivo <strong className="text-slate-900 font-bold">&ldquo;{goalToDelete.title}&rdquo;</strong>?
              {goalToDelete.targetAmount && goalToDelete.targetAmount > 0 ? (
                <span className="block mt-1 text-slate-700 font-medium">
                  Meta financeira: {formatCurrency(goalToDelete.targetAmount)}
                </span>
              ) : null}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = goalToDelete.id;
                  setGoalToDelete(null);
                  onDeleteGoal(idToDelete);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Apagar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
