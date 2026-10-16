import React, { useState, useEffect } from 'react';
import { X, Check, Split, ArrowUpRight, Heart, Users, Sparkles } from 'lucide-react';
import { Transaction } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';

interface CoupleSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSalaries: (
    andrews5: number,
    andrewsAdv: number,
    rayssa5: number,
    rayssaAdv: number,
    targetMonth: string,
    andrewsExtra?: { amount: number; description: string },
    rayssaExtra?: { amount: number; description: string }
  ) => void;
  currentMonth: string;
  existingTransactions: Transaction[];
}

export const CoupleSalaryModal: React.FC<CoupleSalaryModalProps> = ({
  isOpen,
  onClose,
  onSaveSalaries,
  currentMonth,
  existingTransactions,
}) => {
  const [targetMonth, setTargetMonth] = useState(currentMonth);

  // Andrews inputs
  const [andrews5Str, setAndrews5Str] = useState('');
  const [andrewsAdvStr, setAndrewsAdvStr] = useState('');
  const [andrewsExtraStr, setAndrewsExtraStr] = useState('');
  const [andrewsExtraDesc, setAndrewsExtraDesc] = useState('');

  // Rayssa inputs
  const [rayssa5Str, setRayssa5Str] = useState('');
  const [rayssaAdvStr, setRayssaAdvStr] = useState('');
  const [rayssaExtraStr, setRayssaExtraStr] = useState('');
  const [rayssaExtraDesc, setRayssaExtraDesc] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTargetMonth(currentMonth);

    // Pre-fill existing salary values for the month if already present
    const monthIncomes = existingTransactions.filter(
      (t) => t.date.startsWith(currentMonth) && t.type === 'income'
    );

    const a5 = monthIncomes.find(
      (t) =>
        (t.member === 'andrews' || t.description.toLowerCase().includes('andrews')) &&
        (t.category.includes('5º') || t.description.toLowerCase().includes('5º') || (!t.description.toLowerCase().includes('vale') && !t.description.toLowerCase().includes('adiantamento') && !t.category.includes('Diversas') && !t.description.toLowerCase().includes('extra') && !t.description.toLowerCase().includes('bico')))
    );
    const aAdv = monthIncomes.find(
      (t) =>
        (t.member === 'andrews' || t.description.toLowerCase().includes('andrews')) &&
        (t.category.includes('Vale') || t.description.toLowerCase().includes('vale') || t.description.toLowerCase().includes('adiantamento'))
    );
    const aExtra = monthIncomes.find(
      (t) =>
        (t.member === 'andrews' || t.description.toLowerCase().includes('andrews')) &&
        (t.category.includes('Diversas') || t.category.includes('Freelance') || t.description.toLowerCase().includes('extra') || t.description.toLowerCase().includes('bico') || t.description.toLowerCase().includes('diversas'))
    );

    const r5 = monthIncomes.find(
      (t) =>
        (t.member === 'rayssa' || t.description.toLowerCase().includes('rayssa')) &&
        (t.category.includes('5º') || t.description.toLowerCase().includes('5º') || (!t.description.toLowerCase().includes('vale') && !t.description.toLowerCase().includes('adiantamento') && !t.category.includes('Diversas') && !t.description.toLowerCase().includes('extra') && !t.description.toLowerCase().includes('bico')))
    );
    const rAdv = monthIncomes.find(
      (t) =>
        (t.member === 'rayssa' || t.description.toLowerCase().includes('rayssa')) &&
        (t.category.includes('Vale') || t.description.toLowerCase().includes('vale') || t.description.toLowerCase().includes('adiantamento'))
    );
    const rExtra = monthIncomes.find(
      (t) =>
        (t.member === 'rayssa' || t.description.toLowerCase().includes('rayssa')) &&
        (t.category.includes('Diversas') || t.category.includes('Freelance') || t.description.toLowerCase().includes('extra') || t.description.toLowerCase().includes('bico') || t.description.toLowerCase().includes('diversas'))
    );

    if (a5) setAndrews5Str(a5.amount.toFixed(2).replace('.', ','));
    if (aAdv) setAndrewsAdvStr(aAdv.amount.toFixed(2).replace('.', ','));
    if (aExtra) {
      setAndrewsExtraStr(aExtra.amount.toFixed(2).replace('.', ','));
      setAndrewsExtraDesc(aExtra.description);
    }
    if (r5) setRayssa5Str(r5.amount.toFixed(2).replace('.', ','));
    if (rAdv) setRayssaAdvStr(rAdv.amount.toFixed(2).replace('.', ','));
    if (rExtra) {
      setRayssaExtraStr(rExtra.amount.toFixed(2).replace('.', ','));
      setRayssaExtraDesc(rExtra.description);
    }
  }, [isOpen, currentMonth, existingTransactions]);

  if (!isOpen) return null;

  const parseNum = (str: string): number => {
    const clean = str.replace(/\./g, '').replace(',', '.').trim();
    const num = parseFloat(clean);
    return isNaN(num) || num < 0 ? 0 : num;
  };

  const a5Val = parseNum(andrews5Str);
  const aAdvVal = parseNum(andrewsAdvStr);
  const aExtraVal = parseNum(andrewsExtraStr);

  const r5Val = parseNum(rayssa5Str);
  const rAdvVal = parseNum(rayssaAdvStr);
  const rExtraVal = parseNum(rayssaExtraStr);

  const andrewsTotal = a5Val + aAdvVal + aExtraVal;
  const rayssaTotal = r5Val + rAdvVal + rExtraVal;
  const combinedTotal = andrewsTotal + rayssaTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (combinedTotal <= 0) {
      alert('Informe ao menos um valor de salário ou renda extra para Andrews ou Rayssa.');
      return;
    }
    onSaveSalaries(
      a5Val,
      aAdvVal,
      r5Val,
      rAdvVal,
      targetMonth,
      aExtraVal > 0 ? { amount: aExtraVal, description: andrewsExtraDesc.trim() || 'Entradas Diversas / Bicos (Andrews)' } : undefined,
      rExtraVal > 0 ? { amount: rExtraVal, description: rayssaExtraDesc.trim() || 'Entradas Diversas / Renda Extra (Rayssa)' } : undefined
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 my-8 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Split className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Salários do Casal (Andrews & Rayssa)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  Casal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure os salários e adiantamentos de cada um para gerar o fluxo financeiro conjunto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Mês de Competência */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label htmlFor="couple-salary-month" className="text-xs font-bold text-slate-700">
              Mês de Referência:
            </label>
            <input
              id="couple-salary-month"
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bloco Andrews */}
            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">👨‍💼</span>
                  <h4 className="text-sm font-bold text-blue-950">
                    Salário Andrews
                  </h4>
                </div>
                <span className="text-xs font-extrabold text-blue-700">
                  {formatCurrency(andrewsTotal)}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  1. Salário (5º Dia Útil) - R$
                </label>
                <input
                  type="text"
                  placeholder="Ex: 4.500,00"
                  value={andrews5Str}
                  onChange={(e) => setAndrews5Str(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Data prevista: dia 05
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  2. Adiantamento / Vale - R$
                </label>
                <input
                  type="text"
                  placeholder="Ex: 3.000,00"
                  value={andrewsAdvStr}
                  onChange={(e) => setAndrewsAdvStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Data prevista: dia 20
                </span>
              </div>

              <div className="pt-2 border-t border-blue-200/60">
                <label className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                  3. Entradas Diversas / Renda Extra (Bicos, Freelas) - R$
                </label>
                <input
                  type="text"
                  placeholder="Ex: 600,00"
                  value={andrewsExtraStr}
                  onChange={(e) => setAndrewsExtraStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Descrição opcional (ex: Bico de informática, freela)"
                  value={andrewsExtraDesc}
                  onChange={(e) => setAndrewsExtraDesc(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden text-slate-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Entrada avulsa somada à sua receita do mês
                </span>
              </div>
            </div>

            {/* Bloco Rayssa */}
            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">👩‍💼</span>
                  <h4 className="text-sm font-bold text-purple-950">
                    Salário Rayssa
                  </h4>
                </div>
                <span className="text-xs font-extrabold text-purple-700">
                  {formatCurrency(rayssaTotal)}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  1. Salário (5º Dia Útil) - R$
                </label>
                <input
                  type="text"
                  placeholder="Ex: 4.200,00"
                  value={rayssa5Str}
                  onChange={(e) => setRayssa5Str(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Data prevista: dia 05
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  2. Adiantamento / Vale - R$
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2.800,00"
                  value={rayssaAdvStr}
                  onChange={(e) => setRayssaAdvStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Data prevista: dia 20
                </span>
              </div>

              <div className="pt-2 border-t border-purple-200/60">
                <label className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block mb-1">
                  3. Entradas Diversas / Renda Extra - R$
                </label>
                <input
                  type="text"
                  placeholder="Ex: 400,00"
                  value={rayssaExtraStr}
                  onChange={(e) => setRayssaExtraStr(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Descrição opcional (ex: Vendas, serviço extra)"
                  value={rayssaExtraDesc}
                  onChange={(e) => setRayssaExtraDesc(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-hidden text-slate-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Entrada avulsa somada à receita dela
                </span>
              </div>
            </div>
          </div>

          {/* Renda Total do Casal */}
          <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">
                  Renda Total do Casal
                </span>
                <p className="text-xl font-black">
                  {formatCurrency(combinedTotal)}
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-emerald-100">
              <p>Andrews: {formatCurrency(andrewsTotal)}</p>
              <p>Rayssa: {formatCurrency(rayssaTotal)}</p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Salvar Salários do Casal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
