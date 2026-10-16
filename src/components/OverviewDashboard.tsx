import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Layers,
  ChevronRight,
  Wallet,
  Split,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';
import { MonthlyStats, Transaction, ViewTab, DailyCommitment } from '../types.ts';
import { formatCurrency, formatPercent, formatDateBR } from '../utils/formatters.ts';
import { DueAlertsBanner } from './DueAlertsBanner.tsx';
import { CreditCardInstallmentsCard } from './CreditCardInstallmentsCard.tsx';
import { DailyCommitmentsCard } from './DailyCommitmentsCard.tsx';
import { groupInstallmentPurchases, calculateDueAlerts } from '../utils/installments.ts';

interface OverviewDashboardProps {
  stats: MonthlyStats;
  historicalTrend: { monthKey: string; label: string; receitas: number; despesas: number; saldo: number }[];
  transactions: Transaction[];
  commitments?: DailyCommitment[];
  onToggleCommitment?: (id: string) => void;
  onOpenNewCommitmentModal?: (type?: 'emergency' | 'appointment' | 'task') => void;
  onNavigateTab: (tab: ViewTab) => void;
  onOpenNewTransaction: () => void;
  onOpenNewInstallment?: () => void;
  onOpenSplitSalary?: () => void;
  onOpenQuickSetup?: () => void;
  onRemoveDuplicateSalaries?: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onDeleteGroup?: (groupId: string, title: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  historicalTrend,
  transactions,
  commitments = [],
  onToggleCommitment,
  onOpenNewCommitmentModal,
  onNavigateTab,
  onOpenNewTransaction,
  onOpenNewInstallment,
  onOpenSplitSalary,
  onOpenQuickSetup,
  onRemoveDuplicateSalaries,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
  onDeleteGroup,
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  // Agrupamentos de compras parceladas e alertas de vencimento
  const installmentGroups = useMemo(() => {
    return groupInstallmentPurchases(transactions);
  }, [transactions]);

  const dueAlerts = useMemo(() => {
    return calculateDueAlerts(transactions);
  }, [transactions]);

  const isSurplus = stats.netSavings >= 0;
  const recentTransactions = transactions
    .filter((tx) => tx.date.startsWith(stats.monthKey))
    .slice(0, 5);

  // Split Salary Analysis for the selected month
  const monthIncomeTxs = transactions.filter(
    (tx) => tx.date.startsWith(stats.monthKey) && tx.type === 'income'
  );

  const salary5Tx = monthIncomeTxs.find(
    (tx) =>
      tx.category === 'Salário (5º Dia Útil)' ||
      tx.description.toLowerCase().includes('5º dia útil') ||
      tx.description.toLowerCase().includes('5° dia útil')
  );

  const advSalaryTx = monthIncomeTxs.find(
    (tx) =>
      tx.category === 'Adiantamento Salarial (Vale)' ||
      tx.description.toLowerCase().includes('adiantamento') ||
      tx.description.toLowerCase().includes('vale')
  );

  const otherSalaryTxs = monthIncomeTxs.filter(
    (tx) =>
      tx.id !== salary5Tx?.id &&
      tx.id !== advSalaryTx?.id &&
      (tx.category.toLowerCase().includes('salário') || tx.category.toLowerCase().includes('salario'))
  );

  const allSalaryTxs = monthIncomeTxs.filter(
    (tx) =>
      tx.category.toLowerCase().includes('salário') ||
      tx.category.toLowerCase().includes('salario') ||
      tx.category.toLowerCase().includes('vale') ||
      tx.category.toLowerCase().includes('adiantamento') ||
      tx.description.toLowerCase().includes('salário') ||
      tx.description.toLowerCase().includes('salario') ||
      tx.description.toLowerCase().includes('vale') ||
      tx.description.toLowerCase().includes('adiantamento')
  );

  const hasDuplicateSalaries = allSalaryTxs.length > 2;

  const totalSalaryExpected =
    (salary5Tx ? salary5Tx.amount : 0) +
    (advSalaryTx ? advSalaryTx.amount : 0) +
    otherSalaryTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const totalSalaryReceived =
    (salary5Tx && salary5Tx.status === 'completed' ? salary5Tx.amount : 0) +
    (advSalaryTx && advSalaryTx.status === 'completed' ? advSalaryTx.amount : 0) +
    otherSalaryTxs.filter((tx) => tx.status === 'completed').reduce((sum, tx) => sum + tx.amount, 0);

  const salaryReceivedPercent =
    totalSalaryExpected > 0 ? (totalSalaryReceived / totalSalaryExpected) * 100 : 0;

  return (
    <div id="overview-dashboard-container" className="space-y-6">
      {/* Alertas de Vencimento de Parcelas e Contas Próximas */}
      <DueAlertsBanner
        alerts={dueAlerts}
        onMarkAsPaid={(id) => onToggleStatus && onToggleStatus(id)}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Receitas */}
        <div
          id="kpi-card-income"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receitas do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalIncome)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {stats.comparisonWithPrevious.incomeChangePercent >= 0 ? (
                <span className="inline-flex items-center text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3 h-3" />
                  {formatPercent(stats.comparisonWithPrevious.incomeChangePercent)}
                </span>
              ) : (
                <span className="inline-flex items-center text-rose-700 font-medium bg-rose-50 px-1.5 py-0.5 rounded-md">
                  <ArrowDownRight className="w-3 h-3" />
                  {formatPercent(stats.comparisonWithPrevious.incomeChangePercent)}
                </span>
              )}
              <span className="text-slate-400">vs. mês anterior</span>
            </div>
          </div>
        </div>

        {/* Card: Despesas */}
        <div
          id="kpi-card-expense"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Despesas do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalExpense)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {stats.comparisonWithPrevious.expenseChangePercent <= 0 ? (
                <span className="inline-flex items-center text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <ArrowDownRight className="w-3 h-3" />
                  {formatPercent(stats.comparisonWithPrevious.expenseChangePercent)}
                </span>
              ) : (
                <span className="inline-flex items-center text-rose-700 font-medium bg-rose-50 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="w-3 h-3" />
                  {formatPercent(stats.comparisonWithPrevious.expenseChangePercent)}
                </span>
              )}
              <span className="text-slate-400">vs. mês anterior</span>
            </div>
          </div>
        </div>

        {/* Card: Saldo Líquido */}
        <div
          id="kpi-card-balance"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Líquido
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isSurplus ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-bold tracking-tight ${
                isSurplus ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(stats.netSavings)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`font-semibold px-1.5 py-0.5 rounded-md ${
                  isSurplus ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {isSurplus ? 'Superávit' : 'Déficit no Mês'}
              </span>
              <span className="text-slate-400">
                {stats.pendingExpense > 0 && `(R$ ${stats.pendingExpense.toFixed(0)} pendente)`}
              </span>
            </div>
          </div>
        </div>

        {/* Card: Taxa de Poupança */}
        <div
          id="kpi-card-savings"
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Taxa de Poupança
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats.savingsRate.toFixed(1)}%
            </div>
            {/* Progress bar */}
            <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.savingsRate >= 20 ? 'bg-emerald-500' : stats.savingsRate >= 0 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, stats.savingsRate))}%` }}
              />
            </div>
            <div className="mt-1.5 text-[11px] text-slate-400">
              {stats.savingsRate >= 20
                ? 'Meta de 20%+ atingida'
                : 'Abaixo da meta recomendada (20%)'}
            </div>
          </div>
        </div>
      </div>

      {/* Seção Estrutura do Salário Dividido (5º Dia Útil & Adiantamento/Vale) */}
      <div
        id="card-split-salary-overview"
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Fluxo de Salário Dividido • {stats.monthName}
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhamento das entradas do 5º dia útil e adiantamento quinzenal (vale)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenQuickSetup && (
              <button
                id="btn-quick-setup-dash"
                type="button"
                onClick={onOpenQuickSetup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200 transition-colors cursor-pointer"
                title="Deixar apenas 1 salário, 1 vale e despesa de R$ 55"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Configuração Inicial</span>
              </button>
            )}
            <button
              id="btn-quick-split-salary"
              type="button"
              onClick={onOpenSplitSalary || onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Split className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lançar / Ajustar Salário</span>
            </button>
          </div>
        </div>

        {/* Alerta de Salários Duplicados / Repetidos */}
        {hasDuplicateSalaries && (
          <div className="mt-3.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">
                  Atenção: Há {allSalaryTxs.length} lançamentos de salário neste mês (somando {formatCurrency(totalSalaryExpected)})
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Parece que foram salvos lançamentos repetidos. Você pode remover os duplicados automaticamente ou redefinir tudo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {onRemoveDuplicateSalaries && (
                <button
                  type="button"
                  onClick={onRemoveDuplicateSalaries}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Remover Duplicados
                </button>
              )}
              {onOpenQuickSetup && (
                <button
                  type="button"
                  onClick={onOpenQuickSetup}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Deixar 3 Dados Iniciais
                </button>
              )}
            </div>
          </div>
        )}

        {/* Status das duas parcelas */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parcela 1: Salário 5º Dia Útil */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  1ª Entrada • Saldo Líquido
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Salário (5º Dia Útil)
                </h4>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  salary5Tx?.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : salary5Tx
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {salary5Tx?.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Creditado</span>
                  </>
                ) : salary5Tx ? (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Aguardando Data</span>
                  </>
                ) : (
                  <span>Não Lançado</span>
                )}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900">
                {salary5Tx ? formatCurrency(salary5Tx.amount) : 'R$ 0,00'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {salary5Tx ? formatDateBR(salary5Tx.date) : 'Aprox. 5º dia útil'}
              </span>
            </div>

            {salary5Tx && (
              <div className="mt-2 text-[11px] text-slate-500 truncate">
                {salary5Tx.description}
                {salary5Tx.notes ? ` • ${salary5Tx.notes}` : ''}
              </div>
            )}
          </div>

          {/* Parcela 2: Adiantamento Salarial (Vale) */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  2ª Entrada • Quinzenal
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Adiantamento Salarial (Vale)
                </h4>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  advSalaryTx?.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : advSalaryTx
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {advSalaryTx?.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Creditado</span>
                  </>
                ) : advSalaryTx ? (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Previsto (dia 20)</span>
                  </>
                ) : (
                  <span>Não Lançado</span>
                )}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900">
                {advSalaryTx ? formatCurrency(advSalaryTx.amount) : 'R$ 0,00'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {advSalaryTx ? formatDateBR(advSalaryTx.date) : 'Aprox. dia 20'}
              </span>
            </div>

            {advSalaryTx && (
              <div className="mt-2 text-[11px] text-slate-500 truncate">
                {advSalaryTx.description}
                {advSalaryTx.notes ? ` • ${advSalaryTx.notes}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Resumo Consolidado do Salário do Mês */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400">Total Proventos Salariais: </span>
              <span className="font-bold text-slate-900">{formatCurrency(totalSalaryExpected)}</span>
            </div>
            <div>
              <span className="text-slate-400">Já Recebido: </span>
              <span className="font-semibold text-emerald-600">{formatCurrency(totalSalaryReceived)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              {salaryReceivedPercent.toFixed(0)}% creditado
            </span>
            <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, salaryReceivedPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Socorros do Dia & Compromissos de Hoje */}
      <DailyCommitmentsCard
        commitments={commitments}
        onToggleComplete={(id) => onToggleCommitment && onToggleCommitment(id)}
        onOpenAgenda={() => onNavigateTab('agenda')}
        onOpenNewModal={(t) => onOpenNewCommitmentModal && onOpenNewCommitmentModal(t)}
      />

      {/* Seção de Acompanhamento de Compras Parceladas no Cartão de Crédito */}
      <CreditCardInstallmentsCard
        groups={installmentGroups}
        onOpenNewInstallment={onOpenNewInstallment || onOpenNewTransaction}
        onToggleStatus={(id) => onToggleStatus && onToggleStatus(id)}
        onDeleteGroup={onDeleteGroup || (() => {})}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Gastos por Categoria (Donut + Legend) */}
        <div
          id="chart-category-expenses"
          className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                Gastos por Categoria ({stats.monthName})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribuição percentual das despesas
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {stats.categoryExpenses.length} categorias
            </span>
          </div>

          {stats.categoryExpenses.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
              <p>Nenhuma despesa registrada neste mês.</p>
              <button
                type="button"
                onClick={onOpenNewTransaction}
                className="mt-3 text-indigo-600 font-semibold hover:underline"
              >
                + Adicionar primeiro gasto
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryExpenses}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                      onMouseLeave={() => setActiveCategoryIndex(null)}
                    >
                      {stats.categoryExpenses.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={entry.color}
                          opacity={
                            activeCategoryIndex === null || activeCategoryIndex === index
                              ? 1
                              : 0.4
                          }
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        formatCurrency(typeof val === 'number' ? val : Number(val || 0)),
                        'Total',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Categorias compact list */}
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {stats.categoryExpenses.map((cat, idx) => (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      activeCategoryIndex === idx ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-slate-700 truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-500 font-medium">
                        {cat.percentage.toFixed(1)}%
                      </span>
                      <span className="text-slate-900 font-bold">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gráfico 2: Evolução Histórica (6 Meses) */}
        <div
          id="chart-historical-trend"
          className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                Evolução Financeira dos Últimos Meses
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativo de Receitas, Despesas e Saldo Líquido
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span className="text-slate-600 font-medium">Receitas</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                <span className="text-slate-600 font-medium">Despesas</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-indigo-600" />
                <span className="text-slate-600 font-medium">Saldo</span>
              </div>
            </div>
          </div>

          <div className="pt-4 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={historicalTrend}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number | string | undefined, name: string | number | undefined) => [
                    formatCurrency(typeof val === 'number' ? val : Number(val || 0)),
                    name === 'receitas'
                      ? 'Receitas'
                      : name === 'despesas'
                      ? 'Despesas'
                      : 'Saldo Líquido',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar
                  dataKey="receitas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                  name="receitas"
                />
                <Bar
                  dataKey="despesas"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                  name="despesas"
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ fill: '#4f46e5', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="saldo"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Curva de Gastos Diários & Métodos de Pagamento & Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Curva de Gastos Diários no Mês */}
        <div
          id="chart-daily-expenses"
          className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Gastos Dia a Dia ({stats.monthName})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acompanhe em quais dias do mês ocorreram picos de despesas
              </p>
            </div>
            {stats.highestExpenseDay && (
              <div className="text-xs text-right">
                <span className="text-slate-400">Pico: </span>
                <span className="font-semibold text-rose-600">
                  {formatCurrency(stats.highestExpenseDay.amount)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.dailyExpenses}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip
                  formatter={(val: number | string | undefined) => [
                    formatCurrency(typeof val === 'number' ? val : Number(val || 0)),
                    'Gasto no dia',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Bar dataKey="amount" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Métodos de Pagamento & Atalho de Relatório */}
        <div
          id="card-payment-methods"
          className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                Formas de Pagamento
              </h3>
              <span className="text-[11px] text-slate-400">Despesas</span>
            </div>

            <div className="mt-4 space-y-3">
              {stats.paymentMethodDistribution.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Nenhum dado registrado para este mês.
                </p>
              ) : (
                stats.paymentMethodDistribution.map((item) => (
                  <div key={item.method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.amount)} ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Banner trigger to auto report */}
          <div className="mt-5 p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between">
            <div>
              <p className="text-xs font-bold">Relatório Mensal Pronto</p>
              <p className="text-[11px] text-slate-300">
                Análise detalhada e pronta para impressão/PDF
              </p>
            </div>
            <button
              id="goto-monthly-report-btn"
              type="button"
              onClick={() => onNavigateTab('monthly_report')}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Abrir Relatório Mensal"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Preview Section */}
      <div
        id="recent-transactions-preview"
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Lançamentos Recentes ({stats.monthName})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Últimas transações registradas neste período
            </p>
          </div>
          <button
            id="view-all-txs-btn"
            type="button"
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1"
          >
            Ver todos ({transactions.filter((tx) => tx.date.startsWith(stats.monthKey)).length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              Nenhuma transação cadastrada em {stats.monthName}.
            </p>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => onEditTransaction(tx)}
                className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{tx.date.split('-').reverse().join('/')}</span>
                      {tx.status === 'pending' && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-medium px-1.5 py-0.2 rounded-md">
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                  {onDeleteTransaction && (
                    <button
                      type="button"
                      title="Excluir este lançamento"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Excluir "${tx.description}" (${formatCurrency(tx.amount)})?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
