import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Split,
  Sparkles,
  Clock,
  AlertTriangle,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { MonthlyStats, Transaction, InstallmentGroup, GoalItem, CoupleMember } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';
import { TransactionList } from './TransactionList.tsx';
import { DueAlertsBanner } from './DueAlertsBanner.tsx';
import { calculateDueAlerts } from '../utils/installments.ts';
import { SavingsGoalsSection } from './SavingsGoalsSection.tsx';

interface FinancesPageProps {
  stats: MonthlyStats;
  transactions: Transaction[];
  selectedMonth: string;
  onOpenNewTransaction: () => void;
  onOpenSplitSalary?: () => void;
  onOpenQuickSetup?: () => void;
  onOpenCoupleSalaries?: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleStatus: (id: string) => void;
  hasDemoTransactions?: boolean;
  onClearDemoData?: () => void;
  onClearAllData?: () => void;
  onRemoveDuplicateSalaries?: () => void;
  goals?: GoalItem[];
  onSaveGoal?: (goal: GoalItem) => void;
  onToggleGoal?: (id: string) => void;
  onDeleteGoal?: (id: string) => void;
  activeProfile?: CoupleMember;
  onAddSavingsTransaction?: (desc: string, amount: number, category: string) => void;
}

export const FinancesPage: React.FC<FinancesPageProps> = ({
  stats,
  transactions,
  selectedMonth,
  onOpenNewTransaction,
  onOpenSplitSalary,
  onOpenQuickSetup,
  onOpenCoupleSalaries,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
  hasDemoTransactions,
  onClearDemoData,
  onClearAllData,
  onRemoveDuplicateSalaries,
  goals = [],
  onSaveGoal,
  onToggleGoal,
  onDeleteGoal,
  activeProfile = 'andrews',
  onAddSavingsTransaction,
}) => {
  const isSurplus = stats.netSavings >= 0;
  const dueAlerts = calculateDueAlerts(transactions);

  // Split salary analysis for couple (Andrews & Rayssa)
  const monthIncomeTxs = transactions.filter(
    (tx) => tx.date.startsWith(stats.monthKey) && tx.type === 'income'
  );

  // Andrews salaries
  const andrewsIncomes = monthIncomeTxs.filter(
    (t) => t.member === 'andrews' || t.description.toLowerCase().includes('andrews')
  );
  const andrews5 = andrewsIncomes.find(
    (t) =>
      t.category.includes('5º') ||
      t.description.toLowerCase().includes('5º') ||
      (!t.description.toLowerCase().includes('vale') && !t.description.toLowerCase().includes('adiantamento') && !t.category.includes('Diversas') && !t.description.toLowerCase().includes('extra') && !t.description.toLowerCase().includes('bico'))
  );
  const andrewsAdv = andrewsIncomes.find(
    (t) =>
      t.category.includes('Vale') ||
      t.description.toLowerCase().includes('vale') ||
      t.description.toLowerCase().includes('adiantamento')
  );
  const andrewsExtras = andrewsIncomes.filter(
    (t) => t.id !== andrews5?.id && t.id !== andrewsAdv?.id
  );
  const andrewsExtraTotal = andrewsExtras.reduce((sum, t) => sum + t.amount, 0);

  // Rayssa salaries
  const rayssaIncomes = monthIncomeTxs.filter(
    (t) => t.member === 'rayssa' || t.description.toLowerCase().includes('rayssa')
  );
  const rayssa5 = rayssaIncomes.find(
    (t) =>
      t.category.includes('5º') ||
      t.description.toLowerCase().includes('5º') ||
      (!t.description.toLowerCase().includes('vale') && !t.description.toLowerCase().includes('adiantamento') && !t.category.includes('Diversas') && !t.description.toLowerCase().includes('extra') && !t.description.toLowerCase().includes('bico'))
  );
  const rayssaAdv = rayssaIncomes.find(
    (t) =>
      t.category.includes('Vale') ||
      t.description.toLowerCase().includes('vale') ||
      t.description.toLowerCase().includes('adiantamento')
  );
  const rayssaExtras = rayssaIncomes.filter(
    (t) => t.id !== rayssa5?.id && t.id !== rayssaAdv?.id
  );
  const rayssaExtraTotal = rayssaExtras.reduce((sum, t) => sum + t.amount, 0);

  const andrewsTotal = (andrews5?.amount || 0) + (andrewsAdv?.amount || 0) + andrewsExtraTotal;
  const rayssaTotal = (rayssa5?.amount || 0) + (rayssaAdv?.amount || 0) + rayssaExtraTotal;
  const coupleSalaryTotal = andrewsTotal + rayssaTotal;

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
  const hasDuplicateSalaries = allSalaryTxs.length > 4;

  return (
    <div id="finances-page" className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200/60">
            <Wallet className="w-3.5 h-3.5" />
            <span>Página de Finanças & Extrato</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Finanças & Lançamentos
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Consulte seu extrato completo, filtre entradas e saídas por categoria ou forma de pagamento, e gerencie seu salário em 2 vezes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          {onOpenSplitSalary && (
            <button
              id="finances-btn-split-salary"
              type="button"
              onClick={onOpenSplitSalary}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
            >
              <Split className="w-4 h-4 text-emerald-600" />
              <span>Salário em 2x</span>
            </button>
          )}

          <button
            id="finances-btn-new-tx"
            type="button"
            onClick={onOpenNewTransaction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Due Alerts Banner */}
      {dueAlerts.length > 0 && <DueAlertsBanner alerts={dueAlerts} />}

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Receitas do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {formatCurrency(stats.totalIncome)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.pendingIncome > 0 ? `R$ ${stats.pendingIncome.toFixed(0)} a receber` : 'Total 100% creditado'}
          </p>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Despesas do Mês
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {formatCurrency(stats.totalExpense)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.pendingExpense > 0 ? `R$ ${stats.pendingExpense.toFixed(0)} pendente de pagamento` : 'Todas as contas pagas'}
          </p>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Líquido
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight mt-2 ${isSurplus ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatCurrency(stats.netSavings)}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                isSurplus ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isSurplus ? 'Superávit' : 'Déficit no Mês'}
            </span>
          </div>
        </div>

        {/* Contas a Pagar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              A Pagar (Pendente)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {formatCurrency(stats.pendingExpense)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {stats.pendingExpense === 0 ? 'Tudo quitado neste mês!' : 'Valores ainda não liquidados'}
          </p>
        </div>
      </div>

      {/* Couple Salary Card (Andrews & Rayssa) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Salários do Casal (Andrews & Rayssa) • {stats.monthName}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  👫 Gestão Compartilhada
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Acompanhamento individual dos salários (5º dia útil & vale) e receita total do casal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenCoupleSalaries && (
              <button
                type="button"
                onClick={onOpenCoupleSalaries}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Configurar Salários do Casal</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSplitSalary || onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Split className="w-3.5 h-3.5" />
              <span>+ Lançar Salário</span>
            </button>
          </div>
        </div>

        {/* 2 Blocks: Andrews e Rayssa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Bloco Andrews */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">👨‍💼</span>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">Renda de Andrews</h4>
                  <span className="text-[10px] text-blue-700">5º dia útil & vale</span>
                </div>
              </div>
              <span className="text-sm font-black text-blue-900">
                {formatCurrency(andrewsTotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-[10px] font-semibold text-slate-500 block">5º Dia Útil:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {andrews5 ? formatCurrency(andrews5.amount) : 'R$ 0,00'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Vale Quinzenal:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {andrewsAdv ? formatCurrency(andrewsAdv.amount) : 'R$ 0,00'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Entradas Diversas / Bicos:</span>
                <span className="font-bold text-blue-700 text-xs">
                  {andrewsExtraTotal > 0 ? formatCurrency(andrewsExtraTotal) : 'R$ 0,00'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloco Rayssa */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">👩‍💼</span>
                <div>
                  <h4 className="text-xs font-bold text-purple-950">Renda de Rayssa</h4>
                  <span className="text-[10px] text-purple-700">5º dia útil, vale & extras</span>
                </div>
              </div>
              <span className="text-sm font-black text-purple-900">
                {formatCurrency(rayssaTotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                <span className="text-[10px] font-semibold text-slate-500 block">5º Dia Útil:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {rayssa5 ? formatCurrency(rayssa5.amount) : 'R$ 0,00'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Vale Quinzenal:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {rayssaAdv ? formatCurrency(rayssaAdv.amount) : 'R$ 0,00'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                <span className="text-[10px] font-semibold text-slate-500 block">Entradas Diversas / Extras:</span>
                <span className="font-bold text-purple-700 text-xs">
                  {rayssaExtraTotal > 0 ? formatCurrency(rayssaExtraTotal) : 'R$ 0,00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Combinado do Casal */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">👫</span>
            <span className="font-bold text-slate-800">
              Renda Mensal Combinada do Casal:
            </span>
          </div>
          <span className="text-sm font-black text-emerald-700">
            {formatCurrency(coupleSalaryTotal)}
          </span>
        </div>
      </div>

      {/* Metas para Guardar Dinheiro (Mensal & Anual - Cofrinho & Reservas) */}
      <SavingsGoalsSection
        goals={goals}
        onSaveGoal={onSaveGoal || (() => {})}
        onToggleGoal={onToggleGoal || (() => {})}
        onDeleteGoal={onDeleteGoal || (() => {})}
        activeProfile={activeProfile}
        onAddTransaction={onAddSavingsTransaction}
      />

      {/* Full Transaction List Table */}
      <TransactionList
        transactions={transactions}
        selectedMonth={selectedMonth}
        onOpenNewTransaction={onOpenNewTransaction}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
        onToggleStatus={onToggleStatus}
        hasDemoTransactions={hasDemoTransactions}
        onClearDemoData={onClearDemoData}
        onClearAllData={onClearAllData}
      />
    </div>
  );
};
