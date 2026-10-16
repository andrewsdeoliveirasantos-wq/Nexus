import React, { useMemo } from 'react';
import {
  Calendar,
  Flame,
  Wallet,
  CreditCard,
  FileBarChart2,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Sparkles,
  Split,
  ChevronRight,
  ShieldCheck,
  Bell,
  Heart,
  Users,
  BookOpen,
  Target,
} from 'lucide-react';
import { MonthlyStats, Transaction, DailyCommitment, GoalItem, ViewTab, CommitmentType } from '../types.ts';
import { formatCurrency, formatDateBR } from '../utils/formatters.ts';
import { groupInstallmentPurchases, calculateDueAlerts } from '../utils/installments.ts';

interface HomePageProps {
  stats: MonthlyStats;
  transactions: Transaction[];
  commitments: DailyCommitment[];
  goals?: GoalItem[];
  onNavigateTab: (tab: ViewTab) => void;
  onOpenNewTransaction: () => void;
  onOpenNewInstallment?: () => void;
  onOpenNewCommitment?: (type?: CommitmentType) => void;
  onToggleCommitment?: (id: string) => void;
  onOpenQuickSetup?: () => void;
  onOpenSplitSalary?: () => void;
  onOpenCoupleSalaries?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  stats,
  transactions,
  commitments,
  goals = [],
  onNavigateTab,
  onOpenNewTransaction,
  onOpenNewInstallment,
  onOpenNewCommitment,
  onToggleCommitment,
  onOpenQuickSetup,
  onOpenSplitSalary,
  onOpenCoupleSalaries,
}) => {
  // Today's date string
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Formatted date string in Portuguese
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today);
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  // Time greeting
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // Today's commitments
  const todayItems = useMemo(() => {
    return commitments.filter((c) => c.date === todayStr);
  }, [commitments, todayStr]);

  const pendingEmergencies = useMemo(() => {
    return todayItems.filter((c) => c.type === 'emergency' && !c.completed);
  }, [todayItems]);

  const pendingItems = useMemo(() => {
    return todayItems.filter((c) => !c.completed);
  }, [todayItems]);

  const completedCount = useMemo(() => {
    return todayItems.filter((c) => c.completed).length;
  }, [todayItems]);

  // Next upcoming item for today
  const nextItem = useMemo(() => {
    return [...pendingItems].sort((a, b) => {
      if (a.type === 'emergency' && b.type !== 'emergency') return -1;
      if (b.type === 'emergency' && a.type !== 'emergency') return 1;
      return (a.time || '99:99').localeCompare(b.time || '99:99');
    })[0] || null;
  }, [pendingItems]);

  // Installment groups & debt
  const installmentGroups = useMemo(() => {
    return groupInstallmentPurchases(transactions);
  }, [transactions]);

  const totalCardDebt = installmentGroups.reduce((acc, g) => acc + g.remainingAmount, 0);
  const activeInstallmentsCount = installmentGroups.filter((g) => !g.isFullyPaid).length;

  // Due alerts
  const dueAlerts = useMemo(() => {
    return calculateDueAlerts(transactions);
  }, [transactions]);
  const urgentDueCount = dueAlerts.filter((a) => a.urgency === 'overdue' || a.urgency === 'today').length;

  const isSurplus = stats.netSavings >= 0;

  return (
    <div id="home-page-container" className="space-y-8 animate-fadeIn pb-12">
      {/* Versículo Bíblico Inspirador - Provérbios 21:5 */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 rounded-3xl border border-amber-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs border border-amber-200 mt-0.5 sm:mt-0">
              <BookOpen className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                  Palavra de Sabedoria
                </span>
                <span className="text-amber-400">•</span>
                <span className="text-[11px] font-bold text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                  Provérbios 21:5
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-800 mt-1 italic leading-relaxed">
                &ldquo;Os planos bem elaborados levam à fartura; mas o apressado sempre acaba na miséria.&rdquo;
              </p>
              <p className="text-xs text-amber-900/80 mt-1 font-medium">
                Planejamento financeiro, paciência e metas compartilhadas para o sucesso e fartura do lar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('agenda')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold transition-all shrink-0 self-start sm:self-auto cursor-pointer shadow-xs"
          >
            <Target className="w-3.5 h-3.5 text-amber-600" />
            <span>Ver Metas & Objetivos</span>
          </button>
        </div>
      </div>

      {/* Welcome & Overview Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        {/* Soft background decor */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-50/50 via-slate-50/30 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xs ring-1 ring-slate-900/10 shrink-0 bg-slate-900 hidden sm:block">
              <img
                src="/app-logo.jpg"
                alt="Logotipo NEXUS"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium mb-3 border border-slate-200/60">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{capitalizedDate}</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-800">NEXUS</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {greeting}! Bem-vindo ao NEXUS.
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                <span className="font-semibold text-slate-900">NEXUS • couple finance & life management</span> — Controle conjunto das finanças do casal, faturas de cartões, metas de economia e compromissos sincronizados em tempo real.
              </p>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            {onOpenNewCommitment && (
              <button
                id="home-btn-new-emergency"
                type="button"
                onClick={() => onOpenNewCommitment('emergency')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>+ Socorro do Dia</span>
              </button>
            )}

            <button
              id="home-btn-new-tx"
              type="button"
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Começar do Zero Notice */}
        {transactions.length === 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-emerald-950">
                  Aplicativo 100% zerado e pronto para você começar do zero!
                </p>
                <p className="text-emerald-800/90 mt-0.5">
                  Nenhum dado ou número de exemplo. Cadastre o seu salário líquido ou primeira despesa quando quiser.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={onOpenSplitSalary || onOpenNewTransaction}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
              >
                + Lançar Salário
              </button>
              <button
                type="button"
                onClick={onOpenNewTransaction}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold transition-colors cursor-pointer"
              >
                + Nova Despesa
              </button>
            </div>
          </div>
        )}

        {/* 3 Executive Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 relative z-10">
          {/* Pillar 1: Agenda & Socorros de Hoje */}
          <div
            id="home-pillar-agenda"
            onClick={() => onNavigateTab('agenda')}
            className="p-5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Seu Dia & Socorros</span>
              </div>
              <span className="text-xs text-rose-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Abrir <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {todayItems.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">
                Nenhum compromisso agendado para hoje. Clique para adicionar.
              </p>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {pendingItems.length} {pendingItems.length === 1 ? 'pendência' : 'pendências'}
                  </span>
                  {completedCount > 0 && (
                    <span className="text-xs text-emerald-600 font-medium">
                      ({completedCount} concluído{completedCount > 1 ? 's' : ''})
                    </span>
                  )}
                </div>

                {nextItem ? (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {nextItem.type === 'emergency' ? (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="font-medium text-slate-800 truncate">{nextItem.title}</span>
                    </div>
                    {nextItem.time && (
                      <span className="text-[11px] font-bold text-slate-500 shrink-0">
                        {nextItem.time}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tudo concluído para hoje!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pillar 2: Saúde Financeira do Mês */}
          <div
            id="home-pillar-finance"
            onClick={() => onNavigateTab('transactions')}
            className="p-5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Saldo Líquido ({stats.monthName})</span>
              </div>
              <span className="text-xs text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Extrato <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.netSavings)}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200/60">
              <div className="flex items-center gap-1 text-emerald-700 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Entradas: {formatCurrency(stats.totalIncome)}</span>
              </div>
              <div className="flex items-center gap-1 text-rose-600 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Saídas: {formatCurrency(stats.totalExpense)}</span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Cartão & Compras Parceladas */}
          <div
            id="home-pillar-installments"
            onClick={() => onNavigateTab('installments')}
            className="p-5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Cartões & Parcelas</span>
              </div>
              <span className="text-xs text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Ver Todas <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalCardDebt)}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200/60">
              <span>{activeInstallmentsCount} compra(s) parcelada(s) ativa(s)</span>
              {urgentDueCount > 0 ? (
                <span className="font-bold text-amber-600">
                  {urgentDueCount} conta(s) vence(m) hoje/breve
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">Faturas em dia</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção Especial: Finanças do Casal (Andrews & Rayssa) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/70 shrink-0">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Salários do Casal ({stats.monthName})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Andrews & Rayssa
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle conjunto de salários e despesas sincronizado em tempo real entre celulares
              </p>
            </div>
          </div>

          {onOpenCoupleSalaries && (
            <button
              type="button"
              onClick={onOpenCoupleSalaries}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Configurar Salários do Casal</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Card Andrews */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <span>👨‍💼</span> Salário Andrews
              </span>
              <span className="text-xs font-black text-blue-700">
                {formatCurrency(stats.andrewsIncome)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Despesas atribuídas:</span>
                <span className="font-semibold text-rose-600">{formatCurrency(stats.andrewsExpense)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-blue-200/50">
                <span>Saldo Andrews:</span>
                <span className={`font-bold ${stats.andrewsIncome - stats.andrewsExpense >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                  {formatCurrency(stats.andrewsIncome - stats.andrewsExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Rayssa */}
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <span>👩‍💼</span> Salário Rayssa
              </span>
              <span className="text-xs font-black text-purple-700">
                {formatCurrency(stats.rayssaIncome)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Despesas atribuídas:</span>
                <span className="font-semibold text-rose-600">{formatCurrency(stats.rayssaExpense)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-purple-200/50">
                <span>Saldo Rayssa:</span>
                <span className={`font-bold ${stats.rayssaIncome - stats.rayssaExpense >= 0 ? 'text-purple-700' : 'text-rose-600'}`}>
                  {formatCurrency(stats.rayssaIncome - stats.rayssaExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Casal (Conjunto) */}
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>👫</span> Total Casal
              </span>
              <span className="text-xs font-black text-emerald-400">
                {formatCurrency(stats.totalIncome)}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Total Despesas:</span>
                <span className="font-semibold text-rose-300">{formatCurrency(stats.totalExpense)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="font-medium text-white">Sobra Líquida Casal:</span>
                <span className={`font-bold ${stats.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(stats.netSavings)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Navigation Hub ("tipo páginas") */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Páginas do Aplicativo
            </h2>
            <p className="text-xs text-slate-500">
              Navegue pelas áreas organizadas do seu sistema
            </p>
          </div>
          <span className="text-xs text-slate-400">Clique para acessar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card Página 1: Agenda & Socorros */}
          <div
            id="nav-card-page-agenda"
            onClick={() => onNavigateTab('agenda')}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                {pendingEmergencies.length > 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse">
                    {pendingEmergencies.length} socorro(s)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                    {todayItems.length} itens hoje
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                Agenda & Socorros do Dia
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Prioridades e urgências do dia com marcação de visto, horários e alarmes sonoros com antecedência.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
              <span>Abrir Agenda</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card Página 2: Finanças & Lançamentos */}
          <div
            id="nav-card-page-transactions"
            onClick={() => onNavigateTab('transactions')}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {transactions.filter((t) => t.date.startsWith(stats.monthKey)).length} lançamentos
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Finanças & Lançamentos
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Extrato bancário completo, controle de receitas, despesas, fluxo do salário em 2 vezes e filtros.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>Ver Extrato</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card Página 3: Cartão & Compras Parceladas */}
          <div
            id="nav-card-page-installments"
            onClick={() => onNavigateTab('installments')}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeInstallmentsCount} ativas
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Cartões & Parcelas
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Página dedicada para compras parceladas no cartão de crédito, faturas futuras e parcelas restantes.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
              <span>Gerenciar Cartões</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card Página 4: Gráficos & Relatórios */}
          <div
            id="nav-card-page-reports"
            onClick={() => onNavigateTab('reports')}
            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 group-hover:scale-105 transition-transform">
                  <FileBarChart2 className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                  {stats.savingsRate.toFixed(0)}% poupança
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                Gráficos & Relatórios
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Visualização analítica de despesas por categoria, evolução diária e relatório mensal pronto para impressão.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600">
              <span>Ver Relatórios</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Setup / Salário Dividido Assistant Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Split className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              Salário em 2 Vezes (5º Dia Útil & Vale Quinzenal)
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Configure os valores do seu salário e o adiantamento para ter o fluxo automático no mês
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          {onOpenQuickSetup && (
            <button
              id="home-quick-setup-btn"
              type="button"
              onClick={onOpenQuickSetup}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
            >
              Configuração Rápida
            </button>
          )}

          <button
            id="home-split-salary-btn"
            type="button"
            onClick={onOpenSplitSalary || onOpenNewTransaction}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Ajustar Salário
          </button>
        </div>
      </div>
    </div>
  );
};
