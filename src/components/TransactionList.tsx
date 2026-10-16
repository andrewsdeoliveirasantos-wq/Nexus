import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types.ts';
import { ALL_CATEGORIES } from '../data/categories.ts';
import { formatCurrency, formatDateBR } from '../utils/formatters.ts';

interface TransactionListProps {
  transactions: Transaction[];
  selectedMonth: string;
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleStatus: (id: string) => void;
  hasDemoTransactions?: boolean;
  onClearDemoData?: () => void;
  onClearAllData?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  selectedMonth,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
  hasDemoTransactions,
  onClearDemoData,
  onClearAllData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [memberFilter, setMemberFilter] = useState<'all' | 'andrews' | 'rayssa'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [filterOnlyCurrentMonth, setFilterOnlyCurrentMonth] = useState(true);
  const [filterInstallmentsOnly, setFilterInstallmentsOnly] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Month filter
        if (filterOnlyCurrentMonth && !tx.date.startsWith(selectedMonth)) {
          return false;
        }
        // Member filter (Andrews vs Rayssa)
        if (memberFilter === 'andrews') {
          const isAndrews = tx.member === 'andrews' || tx.description.toLowerCase().includes('andrews');
          if (!isAndrews && tx.member !== 'both') return false;
        } else if (memberFilter === 'rayssa') {
          const isRayssa = tx.member === 'rayssa' || tx.description.toLowerCase().includes('rayssa');
          if (!isRayssa && tx.member !== 'both') return false;
        }
        // Installments only filter
        if (filterInstallmentsOnly && !tx.installment) {
          return false;
        }
        // Type filter
        if (filterType !== 'all' && tx.type !== filterType) {
          return false;
        }
        // Category filter
        if (filterCategory !== 'all' && tx.category !== filterCategory) {
          return false;
        }
        // Status filter
        if (filterStatus !== 'all' && tx.status !== filterStatus) {
          return false;
        }
        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesDesc = tx.description.toLowerCase().includes(term);
          const matchesCat = tx.category.toLowerCase().includes(term);
          const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(term) : false;
          if (!matchesDesc && !matchesCat && !matchesNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [
    transactions,
    selectedMonth,
    filterOnlyCurrentMonth,
    filterInstallmentsOnly,
    memberFilter,
    filterType,
    filterCategory,
    filterStatus,
    searchTerm,
    sortBy,
  ]);

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div id="transaction-list-container" className="space-y-4">
      {/* Control & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="tx-search-input"
              type="text"
              placeholder="Buscar por descrição, categoria ou nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-800 text-slate-800"
            />
          </div>

          {/* New Transaction Button */}
          <button
            id="tx-list-new-btn"
            type="button"
            onClick={onOpenNewTransaction}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Lançamento</span>
          </button>
        </div>

        {/* Filter Dropdowns and Toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Month Scope Toggle */}
          <button
            id="filter-month-scope-btn"
            type="button"
            onClick={() => setFilterOnlyCurrentMonth(!filterOnlyCurrentMonth)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              filterOnlyCurrentMonth
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {filterOnlyCurrentMonth ? 'Apenas Mês Selecionado' : 'Todos os Meses'}
          </button>

          {/* Installments only toggle button */}
          <button
            id="filter-installments-btn"
            type="button"
            onClick={() => setFilterInstallmentsOnly(!filterInstallmentsOnly)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              filterInstallmentsOnly
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50/60 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Parceladas no Cartão</span>
          </button>

          {/* Type Filter */}
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              id="filter-type-all"
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Todas
            </button>
            <button
              id="filter-type-expense"
              type="button"
              onClick={() => setFilterType('expense')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'expense' ? 'bg-white shadow-2xs text-rose-600' : 'text-slate-500'
              }`}
            >
              Despesas
            </button>
            <button
              id="filter-type-income"
              type="button"
              onClick={() => setFilterType('income')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'income' ? 'bg-white shadow-2xs text-emerald-600' : 'text-slate-500'
              }`}
            >
              Receitas
            </button>
          </div>

          {/* Member Filter Pills (Andrews vs Rayssa) */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setMemberFilter('all')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                memberFilter === 'all' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👫 Casal
            </button>
            <button
              type="button"
              onClick={() => setMemberFilter('andrews')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                memberFilter === 'andrews' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-blue-700'
              }`}
            >
              👨‍💼 Andrews
            </button>
            <button
              type="button"
              onClick={() => setMemberFilter('rayssa')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                memberFilter === 'rayssa' ? 'bg-purple-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-purple-700'
              }`}
            >
              👩‍💼 Rayssa
            </button>
          </div>

          {/* Category Select */}
          <select
            id="filter-category-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white font-medium focus:outline-hidden"
          >
            <option value="all">Todas Categorias</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            id="filter-status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'pending')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white font-medium focus:outline-hidden"
          >
            <option value="all">Status: Todos</option>
            <option value="completed">Concluídos / Pagos</option>
            <option value="pending">Pendentes</option>
          </select>

          {/* Sort By Select */}
          <select
            id="filter-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white font-medium focus:outline-hidden ml-auto"
          >
            <option value="date_desc">Data: Mais recente</option>
            <option value="date_asc">Data: Mais antiga</option>
            <option value="amount_desc">Valor: Maior primeiro</option>
            <option value="amount_asc">Valor: Menor primeiro</option>
          </select>
        </div>
      </div>

      {/* Filter summary bar & demo cleanup indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs px-2 gap-2 text-slate-500">
        <div className="flex items-center gap-2">
          <span>{filteredTransactions.length} lançamentos encontrados</span>
          {hasDemoTransactions && onClearDemoData && (
            <button
              type="button"
              onClick={onClearDemoData}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors"
              title="Remover transações fictícias pré-carregadas"
            >
              <Sparkles className="w-3 h-3" />
              <span>Remover dados de exemplo</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Receitas: <strong className="text-emerald-600">{formatCurrency(totalFilteredIncome)}</strong></span>
          <span>Despesas: <strong className="text-rose-600">{formatCurrency(totalFilteredExpense)}</strong></span>
        </div>
      </div>

      {/* Transactions Table/Card List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Tudo zerado! Pronto para começar do zero.
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Não há nenhum valor de exemplo pré-carregado. Você pode começar adicionando o seu salário líquido, contas do mês ou despesas.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onOpenNewTransaction}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + Adicionar Primeiro Lançamento
              </button>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <p>Nenhuma transação encontrada com os filtros atuais.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className="mt-2 text-indigo-600 font-semibold hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left info: Icon, description, category, date */}
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {tx.description}
                      </span>
                      {/* Member badge */}
                      {tx.member === 'rayssa' || tx.description.toLowerCase().includes('rayssa') ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          👩‍💼 Rayssa
                        </span>
                      ) : tx.member === 'andrews' || tx.description.toLowerCase().includes('andrews') ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          👨‍💼 Andrews
                        </span>
                      ) : tx.member === 'both' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          👫 Casal
                        </span>
                      ) : null}
                      {tx.installment && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <CreditCard className="w-3 h-3" />
                          Parcela {tx.installment.current}/{tx.installment.total}
                        </span>
                      )}
                      {tx.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(tx.id)}
                          title="Clique para marcar como pago"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3 h-3" />
                          Pendente
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Concluído
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="font-medium text-slate-600">{tx.category}</span>
                      <span>•</span>
                      <span>{formatDateBR(tx.date)}</span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-500 truncate max-w-xs">
                            {tx.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right info: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-12 sm:pl-0">
                  <span
                    className={`text-sm sm:text-base font-bold tracking-tight ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      title="Editar"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      title="Excluir"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
