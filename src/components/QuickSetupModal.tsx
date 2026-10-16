import React, { useState, useEffect } from 'react';
import { Check, X, Sparkles, Trash2, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { Transaction } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';

interface QuickSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (salaryAmount: number, advAmount: number, expenseAmount: number, selectedMonth: string) => void;
  existingTransactions: Transaction[];
  currentMonth: string;
}

export const QuickSetupModal: React.FC<QuickSetupModalProps> = ({
  isOpen,
  onClose,
  onApply,
  existingTransactions,
  currentMonth,
}) => {
  // Detect any existing salary and advance values user might have already typed
  const [salaryInput, setSalaryInput] = useState('');
  const [advInput, setAdvInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Try to find the latest user-entered salary for this month or overall
    const salaryTxs = existingTransactions.filter(
      (t) =>
        t.type === 'income' &&
        (t.category.includes('5º') ||
          t.description.toLowerCase().includes('5º') ||
          t.description.toLowerCase().includes('salário') ||
          t.description.toLowerCase().includes('salario')) &&
        !t.category.includes('Vale') &&
        !t.description.toLowerCase().includes('vale') &&
        !t.description.toLowerCase().includes('adiantamento')
    );

    const advTxs = existingTransactions.filter(
      (t) =>
        t.type === 'income' &&
        (t.category.includes('Vale') ||
          t.category.includes('Adiantamento') ||
          t.description.toLowerCase().includes('adiantamento') ||
          t.description.toLowerCase().includes('vale'))
    );

    // Pick most recent user-entered if available (prefer non-seed txs)
    const userSal = salaryTxs.find((t) => !t.id.startsWith('tx-')) || salaryTxs[0];
    const userAdv = advTxs.find((t) => !t.id.startsWith('tx-')) || advTxs[0];

    if (userSal && userSal.amount > 0) {
      setSalaryInput(userSal.amount.toFixed(2).replace('.', ','));
    }
    if (userAdv && userAdv.amount > 0) {
      setAdvInput(userAdv.amount.toFixed(2).replace('.', ','));
    }
  }, [isOpen, existingTransactions]);

  if (!isOpen) return null;

  const parseNumber = (val: string): number => {
    const clean = val.replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(clean);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const salVal = parseNumber(salaryInput);
  const advVal = parseNumber(advInput);
  const expVal = parseNumber(expenseInput);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (salVal <= 0 && advVal <= 0) {
      alert('Por favor, informe ao menos um valor para o salário ou adiantamento.');
      return;
    }
    onApply(salVal, advVal, expVal > 0 ? expVal : 55, currentMonth);
    onClose();
  };

  return (
    <div
      id="quick-setup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="quick-setup-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 my-8 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="quick-setup-title" className="text-base font-bold text-slate-900">
                Iniciar com Meus Dados Reais
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Deixar apenas seu Salário, Adiantamento e a Despesa de R$ 55 (zerando duplicados)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-emerald-600" />
              Como vai funcionar:
            </p>
            <p>
              Ao confirmar, o sistema vai <strong>apagar todas as repetições e dados antigos</strong> e cadastrar exatamente os 3 lançamentos que você quer:
            </p>
          </div>

          {/* Campo 1: Salário 5º Dia Útil */}
          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="qs-salary" className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                1. Salário do 5º Dia Útil (Saldo Líquido)
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Recebido no 5º dia útil
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-700">R$</span>
              <input
                id="qs-salary"
                type="text"
                required
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                placeholder="Ex: 5.880,00"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-300 bg-white font-bold text-base text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <p className="text-[11px] text-emerald-800/80">
              Valor líquido restante creditado no 5º dia útil do mês.
            </p>
          </div>

          {/* Campo 2: Adiantamento Salarial / Vale */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="qs-adv" className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                2. Adiantamento Salarial (Vale do Dia 20)
              </label>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                Previsto dia 20
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-blue-700">R$</span>
              <input
                id="qs-adv"
                type="text"
                required
                value={advInput}
                onChange={(e) => setAdvInput(e.target.value)}
                placeholder="Ex: 3.920,00"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-blue-300 bg-white font-bold text-base text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <p className="text-[11px] text-blue-800/80">
              Valor do adiantamento quinzenal recebido por volta do dia 20.
            </p>
          </div>

          {/* Campo 3: Despesa Única (R$ 55,00) */}
          <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="qs-expense" className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                3. Sua Única Despesa Atual
              </label>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                Despesa
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-rose-700">R$</span>
                <input
                  id="qs-expense"
                  type="text"
                  required
                  value={expenseInput}
                  onChange={(e) => setExpenseInput(e.target.value)}
                  placeholder="55,00"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-rose-300 bg-white font-bold text-base text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <input
                id="qs-expense-desc"
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="Descrição (ex: Despesa inicial)"
                className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <p className="text-[11px] text-rose-800/80">
              Esta será a sua única despesa ativa no momento, totalizando exatamente {formatCurrency(expVal)}.
            </p>
          </div>

          {/* Resumo visual do que ficará no app */}
          <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Total de Receitas (Salário + Vale):</span>
              <span className="font-bold text-emerald-400">{formatCurrency(salVal + advVal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total de Despesas:</span>
              <span className="font-bold text-rose-400">{formatCurrency(expVal)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="font-semibold text-slate-300">Saldo Final Líquido:</span>
              <span className="font-bold text-emerald-300">{formatCurrency(salVal + advVal - expVal)}</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="qs-submit-btn"
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar e Limpar Todo o Restante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
