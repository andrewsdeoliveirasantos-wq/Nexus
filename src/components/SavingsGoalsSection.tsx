import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Target,
  Plus,
  Coins,
  Sparkles,
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit3,
  Trash2,
  ChevronRight,
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  X,
  Check,
} from 'lucide-react';
import { GoalItem, GoalTimeframe, CoupleMember } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';
import { playCheckmarkSound } from '../utils/audioAlert.ts';
import { GoalModal } from './GoalModal.tsx';

interface SavingsGoalsSectionProps {
  goals: GoalItem[];
  onSaveGoal: (goal: GoalItem) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  activeProfile?: CoupleMember;
  onAddTransaction?: (desc: string, amount: number, category: string) => void;
}

export const SavingsGoalsSection: React.FC<SavingsGoalsSectionProps> = ({
  goals,
  onSaveGoal,
  onToggleGoal,
  onDeleteGoal,
  activeProfile = 'andrews',
  onAddTransaction,
}) => {
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [memberFilter, setMemberFilter] = useState<'all' | 'andrews' | 'rayssa'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);
  const [defaultTimeframe, setDefaultTimeframe] = useState<GoalTimeframe>('monthly');

  // Quick Deposit State
  const [depositGoal, setDepositGoal] = useState<GoalItem | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState<string>('');
  const [alsoLogAsExpense, setAlsoLogAsExpense] = useState<boolean>(false);
  const [goalToDelete, setGoalToDelete] = useState<GoalItem | null>(null);

  // Filter goals that are financial or savings oriented (or all goals with targetAmount or timeframe monthly/yearly)
  const savingsGoals = useMemo(() => {
    return goals.filter((g) => {
      // Show monthly and yearly goals (or any with target amount)
      if (timeframeFilter === 'monthly' && g.timeframe !== 'monthly') return false;
      if (timeframeFilter === 'yearly' && g.timeframe !== 'yearly') return false;
      if (timeframeFilter === 'all' && g.timeframe === 'weekly' && !g.targetAmount) return false;

      if (memberFilter === 'andrews') {
        const isAndrews = g.member === 'andrews' || g.title.toLowerCase().includes('andrews');
        if (!isAndrews && g.member !== 'both') return false;
      } else if (memberFilter === 'rayssa') {
        const isRayssa = g.member === 'rayssa' || g.title.toLowerCase().includes('rayssa');
        if (!isRayssa && g.member !== 'both') return false;
      }
      return true;
    });
  }, [goals, timeframeFilter, memberFilter]);

  // Financial Stats of Savings Goals
  const savingsStats = useMemo(() => {
    const monthlyGoals = goals.filter((g) => g.timeframe === 'monthly');
    const yearlyGoals = goals.filter((g) => g.timeframe === 'yearly');

    const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
    const totalSaved = goals.reduce((acc, g) => acc + (g.savedAmount || 0), 0);
    const completedCount = goals.filter((g) => g.completed || (g.targetAmount && (g.savedAmount || 0) >= g.targetAmount)).length;
    const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    const monthlySaved = monthlyGoals.reduce((acc, g) => acc + (g.savedAmount || 0), 0);
    const monthlyTarget = monthlyGoals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);

    const yearlySaved = yearlyGoals.reduce((acc, g) => acc + (g.savedAmount || 0), 0);
    const yearlyTarget = yearlyGoals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);

    return {
      totalTarget,
      totalSaved,
      completedCount,
      progressPercent,
      monthlySaved,
      monthlyTarget,
      yearlySaved,
      yearlyTarget,
      totalCount: goals.length,
    };
  }, [goals]);

  const handleOpenNew = (tf: GoalTimeframe = 'monthly') => {
    setEditingGoal(null);
    setDefaultTimeframe(tf);
    setIsModalOpen(true);
  };

  const handleEdit = (goal: GoalItem) => {
    setEditingGoal(goal);
    setDefaultTimeframe(goal.timeframe);
    setIsModalOpen(true);
  };

  const handleToggleComplete = (goal: GoalItem) => {
    if (!goal.completed) {
      playCheckmarkSound();
    }
    onToggleGoal(goal.id);
  };

  const handleOpenDeposit = (goal: GoalItem) => {
    setDepositGoal(goal);
    setDepositAmountStr('');
    setAlsoLogAsExpense(false);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;

    const clean = depositAmountStr.replace(/\./g, '').replace(',', '.');
    const addVal = parseFloat(clean);
    if (isNaN(addVal) || addVal <= 0) {
      alert('Por favor, informe um valor válido para guardar.');
      return;
    }

    const currentSaved = depositGoal.savedAmount || 0;
    const newSaved = currentSaved + addVal;
    const isCompleted = depositGoal.targetAmount ? newSaved >= depositGoal.targetAmount : depositGoal.completed;

    const updated: GoalItem = {
      ...depositGoal,
      savedAmount: newSaved,
      completed: isCompleted,
      completedAt: isCompleted && !depositGoal.completed ? new Date().toISOString() : depositGoal.completedAt,
    };

    onSaveGoal(updated);

    if (alsoLogAsExpense && onAddTransaction) {
      onAddTransaction(
        `Poupança/Reserva: ${depositGoal.title}`,
        addVal,
        'Investimentos & Poupança'
      );
    }

    playCheckmarkSound();
    setDepositGoal(null);
    setDepositAmountStr('');
  };

  return (
    <div id="savings-goals-finances-area" className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
      {/* Header do Cofrinho / Metas para Guardar Dinheiro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <PiggyBank className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Metas para Guardar Dinheiro (Mensal & Anual)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                Cofrinho & Reservas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina quanto guardar para determinada coisa (ex: arrumar o carro, comprar um tênis, construir o muro) e acompanhe o acumulado.
            </p>
          </div>
        </div>

        {/* Action Buttons: Novo Mensal & Novo Anual */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-add-monthly-savings"
            type="button"
            onClick={() => handleOpenNew('monthly')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Criar meta de guardar dinheiro para este mês"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Meta Mensal</span>
          </button>

          <button
            id="btn-add-yearly-savings"
            type="button"
            onClick={() => handleOpenNew('yearly')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Criar meta de guardar dinheiro ao longo do ano"
          >
            <Award className="w-3.5 h-3.5 text-amber-200" />
            <span>+ Meta Anual</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Guardado em Caixa */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/50 border border-emerald-200/80">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              Total Já Guardado
            </span>
            <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded-full font-bold">
              {savingsStats.progressPercent}% da meta
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950">
            {formatCurrency(savingsStats.totalSaved)}
          </div>
          <div className="text-[11px] text-emerald-800/80 mt-1">
            Meta total estipulada: {formatCurrency(savingsStats.totalTarget)}
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-emerald-200/60 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${savingsStats.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metas Mensais */}
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
          <div className="flex items-center justify-between text-xs text-purple-900 font-semibold mb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              Metas Mensais (P/ o Mês)
            </span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full font-bold">
              Mensal
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950">
            {formatCurrency(savingsStats.monthlySaved)}
          </div>
          <div className="text-[11px] text-purple-800/80 mt-1">
            Meta planejada: {formatCurrency(savingsStats.monthlyTarget)}
          </div>
          <p className="text-[10px] text-purple-700/70 mt-1.5">
            Ex: tênis, conserto do carro, parcela ou compra do mês.
          </p>
        </div>

        {/* Metas Anuais */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
          <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Metas Anuais (P/ o Ano)
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
              Ano
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950">
            {formatCurrency(savingsStats.yearlySaved)}
          </div>
          <div className="text-[11px] text-amber-900/80 mt-1">
            Meta anual: {formatCurrency(savingsStats.yearlyTarget)}
          </div>
          <p className="text-[10px] text-amber-800/70 mt-1.5">
            Ex: construir o muro, reserva de emergência, troca de carro.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Member Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTimeframeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              timeframeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Metas
          </button>
          <button
            type="button"
            onClick={() => setTimeframeFilter('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              timeframeFilter === 'monthly'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>📅 Mensais</span>
          </button>
          <button
            type="button"
            onClick={() => setTimeframeFilter('yearly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              timeframeFilter === 'yearly'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>🏆 Anuais</span>
          </button>
        </div>

        {/* Member Selector Pill */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs">
          <span className="text-[10px] font-bold text-slate-400 px-1.5">De quem:</span>
          <button
            type="button"
            onClick={() => setMemberFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              memberFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setMemberFilter('andrews')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              memberFilter === 'andrews'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👨‍💼 Andrews
          </button>
          <button
            type="button"
            onClick={() => setMemberFilter('rayssa')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              memberFilter === 'rayssa'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👩‍💼 Rayssa
          </button>
        </div>
      </div>

      {/* Grid of Savings Goals */}
      {savingsGoals.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <PiggyBank className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">
            Nenhuma meta cadastrada neste filtro
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Defina uma meta mensal ou anual para guardar dinheiro (ex: arrumar o carro, comprar um tênis, construir o muro).
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenNew('monthly')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              + Criar Meta Mensal
            </button>
            <button
              type="button"
              onClick={() => handleOpenNew('yearly')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              + Criar Meta Anual
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {savingsGoals.map((goal) => {
            const target = goal.targetAmount || 0;
            const saved = goal.savedAmount || 0;
            const percent = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : goal.completed ? 100 : 0;
            const isCompleted = goal.completed || (target > 0 && saved >= target);
            const remaining = Math.max(0, target - saved);

            const isYearly = goal.timeframe === 'yearly';
            const isMonthly = goal.timeframe === 'monthly';

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative group ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-300/80 shadow-2xs'
                    : isYearly
                    ? 'bg-white border-amber-200/90 hover:border-amber-400 hover:shadow-xs'
                    : 'bg-white border-purple-200/90 hover:border-purple-400 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Top Bar of Card: Badges and Member */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isYearly ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <Award className="w-3 h-3 text-amber-700" />
                          <span>Anual</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          <Calendar className="w-3 h-3 text-purple-700" />
                          <span>Mensal</span>
                        </span>
                      )}

                      {/* Member Tag */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {goal.member === 'rayssa'
                          ? '👩‍💼 Rayssa'
                          : goal.member === 'both'
                          ? '👫 Casal'
                          : '👨‍💼 Andrews'}
                      </span>
                    </div>

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs">
                        <Check className="w-3 h-3" />
                        <span>Atingida! 🎉</span>
                      </span>
                    )}
                  </div>

                  {/* Title and Notes */}
                  <h4
                    className={`font-bold text-sm leading-snug ${
                      isCompleted ? 'text-emerald-950 line-through opacity-85' : 'text-slate-900'
                    }`}
                  >
                    {goal.title}
                  </h4>

                  {goal.category && (
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {goal.category}
                    </span>
                  )}

                  {goal.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">
                      &ldquo;{goal.notes}&rdquo;
                    </p>
                  )}

                  {/* Financial Bar */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Já guardado:</span>
                      <span className="font-extrabold text-emerald-700">
                        {formatCurrency(saved)}
                      </span>
                    </div>

                    {target > 0 && (
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Meta final:</span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(target)}
                        </span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-600'
                            : isYearly
                            ? 'bg-amber-500'
                            : 'bg-purple-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Progresso: <b className="text-slate-800">{percent}%</b></span>
                      {target > 0 && remaining > 0 ? (
                        <span>Falta: <b className="text-rose-600">{formatCurrency(remaining)}</b></span>
                      ) : (
                        <span className="text-emerald-700 font-bold">100% Completo!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  {/* + Guardar Dinheiro Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenDeposit(goal)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                    title="Depositar / Guardar mais dinheiro nesta meta"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Guardar R$</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(goal)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200'
                      }`}
                      title={isCompleted ? 'Desmarcar como concluída' : 'Marcar como meta concluída'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(goal)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                      title="Editar meta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setGoalToDelete(goal)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                      title="Excluir meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini-Modal: Guardar Dinheiro / Depositar no Cofrinho */}
      {depositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Guardar Dinheiro</h3>
                  <p className="text-[11px] text-emerald-100 truncate max-w-[240px]">
                    {depositGoal.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDepositGoal(null)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmDeposit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block">Já guardado:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(depositGoal.savedAmount || 0)}
                  </span>
                </div>
                {depositGoal.targetAmount && (
                  <div className="text-right">
                    <span className="text-slate-500 block">Meta final:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(depositGoal.targetAmount)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quanto você deseja guardar agora? (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    placeholder="0,00"
                    value={depositAmountStr}
                    onChange={(e) => setDepositAmountStr(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold text-lg"
                    required
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmountStr(val.toFixed(2).replace('.', ','))}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    + R$ {val}
                  </button>
                ))}
              </div>

              {/* Checkbox: Also register as expense in current month if desired */}
              {onAddTransaction && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoLogAsExpense}
                    onChange={(e) => setAlsoLogAsExpense(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      Registrar também como saída de poupança no mês
                    </span>
                    <span className="text-[11px] text-emerald-800/80 block mt-0.5">
                      Cria uma transação &quot;Poupança: {depositGoal.title}&quot; no extrato para abater do saldo do mês.
                    </span>
                  </div>
                </label>
              )}

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Confirmar e Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Meta */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-2xs">
              <Trash2 className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Excluir esta Meta?
            </h3>
            <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
              Tem certeza que deseja apagar a meta <strong className="text-slate-900 font-bold">&ldquo;{goalToDelete.title}&rdquo;</strong>?
              {goalToDelete.savedAmount && goalToDelete.savedAmount > 0 ? (
                <span className="block mt-1 text-emerald-700 font-bold">
                  Já guardado nela: {formatCurrency(goalToDelete.savedAmount)}
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

      {/* Goal Modal (para criar ou editar a meta) */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(goal) => {
          onSaveGoal(goal);
          setIsModalOpen(false);
        }}
        onDelete={(id) => {
          onDeleteGoal(id);
          setIsModalOpen(false);
        }}
        goalToEdit={editingGoal}
        defaultTimeframe={defaultTimeframe}
        activeProfile={activeProfile}
      />
    </div>
  );
};
