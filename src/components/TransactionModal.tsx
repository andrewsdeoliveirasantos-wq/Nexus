import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Split, Calendar, Wallet, ArrowRight, Trash2, CreditCard, ShoppingBag, Sparkles } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, TransactionStatus, CoupleMember } from '../types.ts';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../data/categories.ts';
import { formatCurrency, formatDateBR } from '../utils/formatters.ts';
import { generateInstallmentTransactions, getInstallmentDate } from '../utils/installments.ts';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>, editId?: string) => void;
  onSaveMultiple?: (transactions: Omit<Transaction, 'id'>[], replaceMonth?: string) => void;
  onDelete?: (id: string) => void;
  transactionToEdit?: Transaction | null;
  defaultDate?: string;
  initialMode?: 'single' | 'split_salary' | 'installments';
  activeProfile?: CoupleMember;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveMultiple,
  onDelete,
  transactionToEdit,
  defaultDate,
  initialMode = 'single',
  activeProfile = 'andrews',
}) => {
  const [modalTab, setModalTab] = useState<'single' | 'split_salary' | 'installments'>('single');

  // Member attribution (Andrews, Rayssa ou Casal)
  const [member, setMember] = useState<CoupleMember>(activeProfile);

  // Single transaction state
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Installments state (Cartão de Crédito)
  const [cardDescription, setCardDescription] = useState('');
  const [cardTotalAmountStr, setCardTotalAmountStr] = useState('');
  const [cardInstallmentsCount, setCardInstallmentsCount] = useState<number>(6);
  const [cardCategory, setCardCategory] = useState('Vestuário & Compras');
  const [cardDueDay, setCardDueDay] = useState<number>(15);
  const [cardStartMonth, setCardStartMonth] = useState('');
  const [cardName, setCardName] = useState('Cartão de Crédito');
  const [cardFirstPaid, setCardFirstPaid] = useState(false);
  const [cardNotes, setCardNotes] = useState('');

  // Split salary state
  const [totalSalaryStr, setTotalSalaryStr] = useState('');
  const [splitRatio, setSplitRatio] = useState<'40_60' | '50_50' | '30_70' | 'custom'>('40_60');
  const [salaryMonth, setSalaryMonth] = useState('');
  const [daySalaryDate, setDaySalaryDate] = useState('');
  const [daySalaryAmount, setDaySalaryAmount] = useState('');
  const [daySalaryDesc, setDaySalaryDesc] = useState('Salário (5º Dia Útil)');
  const [daySalaryStatus, setDaySalaryStatus] = useState<TransactionStatus>('completed');

  const [advSalaryDate, setAdvSalaryDate] = useState('');
  const [advSalaryAmount, setAdvSalaryAmount] = useState('');
  const [advSalaryDesc, setAdvSalaryDesc] = useState('Adiantamento Salarial (Vale)');
  const [advSalaryStatus, setAdvSalaryStatus] = useState<TransactionStatus>('pending');
  const [replaceExistingSalaries, setReplaceExistingSalaries] = useState(true);

  useEffect(() => {
    if (transactionToEdit) {
      setModalTab('single');
      setMember(transactionToEdit.member || activeProfile || 'andrews');
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmountStr(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setPaymentMethod(transactionToEdit.paymentMethod);
      setStatus(transactionToEdit.status);
      setNotes(transactionToEdit.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const monthPrefix = defaultDate || today.substring(0, 7);
      setModalTab(initialMode);
      setMember(activeProfile || 'andrews');
      setType('expense');
      setDescription('');
      setAmountStr('');
      setCategory(EXPENSE_CATEGORIES[0].name);
      setDate(defaultDate ? `${defaultDate}-01` : today);
      setPaymentMethod('pix');
      setStatus('completed');
      setNotes('');

      // Setup split salary defaults for month
      setSalaryMonth(monthPrefix);
      setDaySalaryDate(`${monthPrefix}-05`);
      setAdvSalaryDate(`${monthPrefix}-20`);
      setTotalSalaryStr('');
      setDaySalaryAmount('');
      setAdvSalaryAmount('');
      setDaySalaryDesc(activeProfile === 'rayssa' ? 'Salário Rayssa (5º Dia Útil)' : 'Salário Andrews (5º Dia Útil)');
      setAdvSalaryDesc(activeProfile === 'rayssa' ? 'Adiantamento Rayssa (Vale)' : 'Adiantamento Andrews (Vale)');

      // Setup installment card defaults
      setCardDescription('');
      setCardTotalAmountStr('');
      setCardInstallmentsCount(6);
      setCardCategory('Vestuário & Compras');
      setCardDueDay(15);
      setCardStartMonth(monthPrefix);
      setCardName('Cartão de Crédito');
      setCardFirstPaid(false);
      setCardNotes('');
    }
    setError('');
  }, [transactionToEdit, isOpen, defaultDate, initialMode, activeProfile]);

  // Recalculate split salary amounts based on total & ratio
  const recalculateSplit = (totalValStr: string, ratio: '40_60' | '50_50' | '30_70' | 'custom', currentMonthStr?: string) => {
    const parsedTotal = parseFloat(totalValStr.replace(/\./g, '').replace(',', '.'));
    const month = currentMonthStr || salaryMonth || '2026-09';
    const today = new Date().toISOString().split('T')[0];

    if (!isNaN(parsedTotal) && parsedTotal > 0 && ratio !== 'custom') {
      let advPercent = 0.40;
      let salPercent = 0.60;
      if (ratio === '50_50') {
        advPercent = 0.50;
        salPercent = 0.50;
      } else if (ratio === '30_70') {
        advPercent = 0.30;
        salPercent = 0.70;
      }

      const advVal = Math.round(parsedTotal * advPercent * 100) / 100;
      const salVal = Math.round((parsedTotal - advVal) * 100) / 100;

      setAdvSalaryAmount(advVal.toFixed(2).replace('.', ','));
      setDaySalaryAmount(salVal.toFixed(2).replace('.', ','));

      // Check dates status
      const sDate = `${month}-05`;
      const aDate = `${month}-20`;
      setDaySalaryDate(sDate);
      setAdvSalaryDate(aDate);
      setDaySalaryStatus(sDate <= today ? 'completed' : 'pending');
      setAdvSalaryStatus(aDate <= today ? 'completed' : 'pending');
    }
  };

  const handleTotalSalaryChange = (newVal: string) => {
    setTotalSalaryStr(newVal);
    recalculateSplit(newVal, splitRatio);
  };

  const handleRatioChange = (newRatio: '40_60' | '50_50' | '30_70' | 'custom') => {
    setSplitRatio(newRatio);
    recalculateSplit(totalSalaryStr, newRatio);
  };

  const handleSalaryMonthChange = (newMonth: string) => {
    setSalaryMonth(newMonth);
    const today = new Date().toISOString().split('T')[0];
    const sDate = `${newMonth}-05`;
    const aDate = `${newMonth}-20`;
    setDaySalaryDate(sDate);
    setAdvSalaryDate(aDate);
    setDaySalaryStatus(sDate <= today ? 'completed' : 'pending');
    setAdvSalaryStatus(aDate <= today ? 'completed' : 'pending');
  };

  // When type changes, update category default if incompatible
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      if (!EXPENSE_CATEGORIES.some((c) => c.name === category)) {
        setCategory(EXPENSE_CATEGORIES[0].name);
      }
    } else {
      if (!INCOME_CATEGORIES.some((c) => c.name === category)) {
        setCategory('Salário (5º Dia Útil)');
      }
    }
  };

  const handleApplySalaryPreset = (type: 'salario_5' | 'adiantamento') => {
    setType('income');
    const month = defaultDate || new Date().toISOString().substring(0, 7);
    if (type === 'salario_5') {
      setDescription('Salário (5º Dia Útil) - Empresa');
      setCategory('Salário (5º Dia Útil)');
      setDate(`${month}-05`);
      setPaymentMethod('pix');
      setStatus('completed');
      if (!amountStr) setAmountStr('5880,00');
    } else {
      setDescription('Adiantamento Salarial (Vale)');
      setCategory('Adiantamento Salarial (Vale)');
      setDate(`${month}-20`);
      setPaymentMethod('pix');
      setStatus('pending');
      if (!amountStr) setAmountStr('3920,00');
    }
  };

  if (!isOpen) return null;

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Por favor, informe a descrição do lançamento.');
      return;
    }
    const parsedAmount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor numérico válido maior que zero.');
      return;
    }
    if (!date) {
      setError('Informe a data da transação.');
      return;
    }

    onSave(
      {
        description: description.trim(),
        amount: parsedAmount,
        type,
        category: category || (type === 'expense' ? EXPENSE_CATEGORIES[0].name : 'Salário (5º Dia Útil)'),
        date,
        paymentMethod,
        status,
        notes: notes.trim() || undefined,
        member,
      },
      transactionToEdit ? transactionToEdit.id : undefined
    );
    onClose();
  };

  const handleSubmitSplit = (e: React.FormEvent) => {
    e.preventDefault();
    const salVal = parseFloat(daySalaryAmount.replace(/\./g, '').replace(',', '.'));
    const advVal = parseFloat(advSalaryAmount.replace(/\./g, '').replace(',', '.'));

    if (isNaN(salVal) || salVal <= 0) {
      setError('Informe um valor válido para a parcela do 5º dia útil.');
      return;
    }
    if (isNaN(advVal) || advVal <= 0) {
      setError('Informe um valor válido para a parcela do adiantamento salarial.');
      return;
    }
    if (!daySalaryDate || !advSalaryDate) {
      setError('Informe as datas de ambas as parcelas.');
      return;
    }

    const defaultSalDesc = member === 'rayssa' ? 'Salário Rayssa (5º Dia Útil)' : 'Salário Andrews (5º Dia Útil)';
    const defaultAdvDesc = member === 'rayssa' ? 'Adiantamento Rayssa (Vale)' : 'Adiantamento Andrews (Vale)';

    const tx1: Omit<Transaction, 'id'> = {
      description: daySalaryDesc.trim() || defaultSalDesc,
      amount: salVal,
      type: 'income',
      category: 'Salário (5º Dia Útil)',
      date: daySalaryDate,
      paymentMethod: 'pix',
      status: daySalaryStatus,
      notes: `Saldo líquido mensal do salário (${member === 'rayssa' ? 'Rayssa' : 'Andrews'})`,
      member,
    };

    const tx2: Omit<Transaction, 'id'> = {
      description: advSalaryDesc.trim() || defaultAdvDesc,
      amount: advVal,
      type: 'income',
      category: 'Adiantamento Salarial (Vale)',
      date: advSalaryDate,
      paymentMethod: 'pix',
      status: advSalaryStatus,
      notes: `Adiantamento quinzenal (${member === 'rayssa' ? 'Rayssa' : 'Andrews'})`,
      member,
    };

    const targetMonth = daySalaryDate.substring(0, 7) || salaryMonth;
    if (onSaveMultiple) {
      onSaveMultiple([tx1, tx2], replaceExistingSalaries ? targetMonth : undefined);
    } else {
      onSave(tx1);
      setTimeout(() => onSave(tx2), 50);
    }
    onClose();
  };

  const handleSubmitInstallments = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDesc = cardDescription.trim();
    if (!cleanDesc) {
      setError('Por favor, informe o que você comprou (ex: Tênis Nike, Celular...).');
      return;
    }

    const totalVal = parseFloat(cardTotalAmountStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(totalVal) || totalVal <= 0) {
      setError('Por favor, informe um valor total válido para a compra.');
      return;
    }

    if (cardInstallmentsCount < 1 || cardInstallmentsCount > 60) {
      setError('O número de parcelas deve ser entre 1 e 60.');
      return;
    }

    const startMonth = cardStartMonth || defaultDate || '2026-09';
    const txs = generateInstallmentTransactions({
      description: cleanDesc,
      totalAmount: totalVal,
      installmentsCount: cardInstallmentsCount,
      category: cardCategory || 'Vestuário & Compras',
      dueDay: cardDueDay,
      startMonth,
      cardName: cardName.trim() || 'Cartão de Crédito',
      firstInstallmentPaid: cardFirstPaid,
      notes: cardNotes.trim(),
    });

    const txsWithMember = txs.map((t) => ({ ...t, member }));

    if (onSaveMultiple) {
      onSaveMultiple(txsWithMember);
    } else {
      txsWithMember.forEach((t) => onSave(t));
    }
    onClose();
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div
      id="transaction-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="transaction-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 my-8 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 id="transaction-modal-title" className="text-xl font-bold text-slate-900">
              {transactionToEdit
                ? 'Editar Transação'
                : modalTab === 'split_salary'
                ? 'Lançar Salário Dividido'
                : modalTab === 'installments'
                ? 'Parcelar Compra no Cartão'
                : 'Nova Transação'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {modalTab === 'split_salary'
                ? 'Lançamento automático do 5º dia útil e adiantamento (vale)'
                : modalTab === 'installments'
                ? 'Parcelamento automático com alerta de vencimento mês a mês'
                : 'Organize seus gastos e receitas para relatórios precisos'}
            </p>
          </div>
          <button
            id="transaction-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch (only when adding new transaction) */}
        {!transactionToEdit && (
          <div className="mt-4 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-center">
            <button
              id="tab-single-transaction"
              type="button"
              onClick={() => {
                setModalTab('single');
                setError('');
              }}
              className={`py-1.5 px-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                modalTab === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Individual</span>
            </button>

            <button
              id="tab-card-installments"
              type="button"
              onClick={() => {
                setModalTab('installments');
                setError('');
                if (description && !cardDescription) setCardDescription(description);
                if (amountStr && !cardTotalAmountStr) setCardTotalAmountStr(amountStr);
              }}
              className={`py-1.5 px-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                modalTab === 'installments'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-700 hover:text-indigo-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Parcelado no Cartão</span>
            </button>

            <button
              id="tab-split-salary"
              type="button"
              onClick={() => {
                setModalTab('split_salary');
                setError('');
              }}
              className={`py-1.5 px-2 text-[11px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                modalTab === 'split_salary'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Salário Dividido</span>
            </button>
          </div>
        )}

        {/* Seletor de Membro (Andrews, Rayssa ou Casal) */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
            Lançamento de quem?
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMember('andrews');
                if (modalTab === 'split_salary') {
                  setDaySalaryDesc('Salário Andrews (5º Dia Útil)');
                  setAdvSalaryDesc('Adiantamento Andrews (Vale)');
                }
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                member === 'andrews'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>👨‍💼</span>
              <span>Andrews</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMember('rayssa');
                if (modalTab === 'split_salary') {
                  setDaySalaryDesc('Salário Rayssa (5º Dia Útil)');
                  setAdvSalaryDesc('Adiantamento Rayssa (Vale)');
                }
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                member === 'rayssa'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>👩‍💼</span>
              <span>Rayssa</span>
            </button>

            <button
              type="button"
              onClick={() => setMember('both')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                member === 'both'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>👫</span>
              <span>Casal</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MODE: SPLIT SALARY */}
        {modalTab === 'split_salary' && !transactionToEdit && (
          <form onSubmit={handleSubmitSplit} className="mt-4 space-y-4">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Configuração de Divisão Salarial</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                    Mês de Referência
                  </label>
                  <input
                    type="month"
                    value={salaryMonth}
                    onChange={(e) => handleSalaryMonthChange(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-900 uppercase tracking-wider mb-1">
                    Salário Líquido Total (R$)
                  </label>
                  <input
                    type="text"
                    value={totalSalaryStr}
                    onChange={(e) => handleTotalSalaryChange(e.target.value)}
                    placeholder="9.800,00"
                    className="w-full px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Presets de proporção */}
              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 uppercase tracking-wider mb-1.5">
                  Proporção da Divisão
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRatioChange('40_60')}
                    className={`py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      splitRatio === '40_60'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    40% Vale / 60% Salário
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRatioChange('50_50')}
                    className={`py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      splitRatio === '50_50'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    50% / 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRatioChange('30_70')}
                    className={`py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      splitRatio === '30_70'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    30% Vale / 70% Salário
                  </button>
                </div>
              </div>
            </div>

            {/* Parcela 1: Salário 5º Dia Útil */}
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  1ª Entrada: Salário no 5º Dia Útil
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  R$ {daySalaryAmount}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Descrição</label>
                  <input
                    type="text"
                    value={daySalaryDesc}
                    onChange={(e) => setDaySalaryDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Valor (R$)</label>
                  <input
                    type="text"
                    value={daySalaryAmount}
                    onChange={(e) => {
                      setDaySalaryAmount(e.target.value);
                      setSplitRatio('custom');
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Data Prevista/Efetiva</label>
                  <input
                    type="date"
                    value={daySalaryDate}
                    onChange={(e) => setDaySalaryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Status</label>
                  <select
                    value={daySalaryStatus}
                    onChange={(e) => setDaySalaryStatus(e.target.value as TransactionStatus)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="completed">Concluído / Recebido</option>
                    <option value="pending">Pendente / Agendado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Parcela 2: Adiantamento Salarial */}
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  2ª Entrada: Adiantamento Salarial (Vale)
                </span>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-md">
                  R$ {advSalaryAmount}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Descrição</label>
                  <input
                    type="text"
                    value={advSalaryDesc}
                    onChange={(e) => setAdvSalaryDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Valor (R$)</label>
                  <input
                    type="text"
                    value={advSalaryAmount}
                    onChange={(e) => {
                      setAdvSalaryAmount(e.target.value);
                      setSplitRatio('custom');
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Data Prevista/Efetiva</label>
                  <input
                    type="date"
                    value={advSalaryDate}
                    onChange={(e) => setAdvSalaryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Status</label>
                  <select
                    value={advSalaryStatus}
                    onChange={(e) => setAdvSalaryStatus(e.target.value as TransactionStatus)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="pending">Pendente / Agendado</option>
                    <option value="completed">Concluído / Recebido</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Evitar duplicidade de salários */}
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-start gap-2.5">
              <input
                id="check-replace-salaries"
                type="checkbox"
                checked={replaceExistingSalaries}
                onChange={(e) => setReplaceExistingSalaries(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="check-replace-salaries" className="text-xs text-emerald-950 font-medium cursor-pointer">
                Substituir outros lançamentos de salário deste mês
                <span className="block text-[11px] text-emerald-800/80 font-normal mt-0.5">
                  Evita que seus salários fiquem duplicados ou somados com dados de teste antigos.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-split-salary"
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lançar as 2 Parcelas do Salário</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE: INSTALLMENTS PURCHASE (Cartão de Crédito) */}
        {modalTab === 'installments' && !transactionToEdit && (
          <form onSubmit={handleSubmitInstallments} className="mt-4 space-y-4">
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Cadastro de Compra Parcelada no Cartão de Crédito</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Informe o que você comprou (ex: tênis, celular, eletrodoméstico) e a quantidade de parcelas.
                O sistema gerará cada parcela com vencimento mês a mês e emitirá alertas para você não esquecer de pagar!
              </p>

              {/* Descrição e Valor Total */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="card-description" className="block text-[11px] font-semibold text-indigo-950 uppercase tracking-wider mb-1">
                    O que você comprou? *
                  </label>
                  <input
                    id="card-description"
                    type="text"
                    placeholder="Ex: Tênis Nike, Celular novo, Geladeira..."
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="card-total-amount" className="block text-[11px] font-semibold text-indigo-950 uppercase tracking-wider mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    id="card-total-amount"
                    type="text"
                    placeholder="600,00"
                    value={cardTotalAmountStr}
                    onChange={(e) => setCardTotalAmountStr(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>
              </div>

              {/* Quantidade de Parcelas com botões rápidos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-indigo-950 uppercase tracking-wider">
                    Número de Parcelas: <strong className="text-indigo-700 font-extrabold text-sm">{cardInstallmentsCount}x</strong>
                  </label>
                  <span className="text-[11px] font-bold text-indigo-700">
                    {(() => {
                      const total = parseFloat(cardTotalAmountStr.replace(/\./g, '').replace(',', '.')) || 0;
                      const part = cardInstallmentsCount > 0 ? total / cardInstallmentsCount : 0;
                      return `${cardInstallmentsCount}x de ${formatCurrency(part)}`;
                    })()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCardInstallmentsCount(n)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        cardInstallmentsCount === n
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                      }`}
                    >
                      {n}x
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] text-slate-500 font-medium">Outro:</span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={cardInstallmentsCount}
                      onChange={(e) => setCardInstallmentsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-14 px-2 py-0.5 text-xs text-center font-bold bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Dia de Vencimento da Fatura e Mês Inicial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="card-due-day" className="block text-[11px] font-semibold text-indigo-950 uppercase tracking-wider mb-1">
                    Dia do Vencimento da Fatura *
                  </label>
                  <select
                    id="card-due-day"
                    value={cardDueDay}
                    onChange={(e) => setCardDueDay(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
                  >
                    {[1, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30].map((d) => (
                      <option key={d} value={d}>
                        Dia {d < 10 ? `0${d}` : d} de cada mês
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="card-start-month" className="block text-[11px] font-semibold text-indigo-950 uppercase tracking-wider mb-1">
                    Mês da 1ª Parcela *
                  </label>
                  <input
                    id="card-start-month"
                    type="month"
                    value={cardStartMonth}
                    onChange={(e) => setCardStartMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>
              </div>

              {/* Cartão e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="card-name" className="block text-[11px] font-semibold text-indigo-950 uppercase tracking-wider mb-1">
                    Nome do Cartão (Opcional)
                  </label>
                  <input
                    id="card-name"
                    type="text"
                    placeholder="Ex: Cartão Nubank, Mastercard..."
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="card-category" className="block text-[11px] font-semibold text-indigo-950 uppercase tracking-wider mb-1">
                    Categoria do Gasto
                  </label>
                  <select
                    id="card-category"
                    value={cardCategory}
                    onChange={(e) => setCardCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-medium text-slate-900"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status da 1ª Parcela */}
              <div className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center justify-between gap-3">
                <div>
                  <label htmlFor="card-first-paid" className="text-xs font-bold text-slate-800 block cursor-pointer">
                    A 1ª parcela já foi paga na fatura atual?
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Se marcada, a parcela 1/{cardInstallmentsCount} entrará como concluída. As demais ({cardInstallmentsCount - 1}x) ficarão agendadas e com alertas.
                  </p>
                </div>
                <input
                  id="card-first-paid"
                  type="checkbox"
                  checked={cardFirstPaid}
                  onChange={(e) => setCardFirstPaid(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Pré-visualização das Parcelas */}
              <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 text-xs text-slate-700">
                <span className="font-bold text-indigo-900 block mb-1.5">
                  Cronograma das Parcelas a serem geradas:
                </span>
                <div className="space-y-1 text-[11px] text-slate-600 max-h-32 overflow-y-auto pr-1">
                  {Array.from({ length: Math.min(cardInstallmentsCount, 6) }).map((_, idx) => {
                    const [y, m] = (cardStartMonth || '2026-09').split('-').map((v) => parseInt(v, 10));
                    const installmentDate = getInstallmentDate(y, (m || 9) - 1, cardDueDay, idx);
                    const total = parseFloat(cardTotalAmountStr.replace(/\./g, '').replace(',', '.')) || 0;
                    const part = cardInstallmentsCount > 0 ? total / cardInstallmentsCount : 0;
                    const isFirst = idx === 0;

                    return (
                      <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-50">
                        <span>
                          Parcela <strong>{idx + 1}/{cardInstallmentsCount}</strong> • Vence em{' '}
                          <strong>{formatDateBR(installmentDate)}</strong>
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(part)}{' '}
                          {isFirst && cardFirstPaid && (
                            <span className="text-[10px] text-emerald-600 font-bold">(Paga)</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {cardInstallmentsCount > 6 && (
                    <p className="text-[10px] text-slate-400 text-center pt-1 italic">
                      + {cardInstallmentsCount - 6} parcelas seguintes calculadas mês a mês com seus vencimentos
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-card-installments"
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Compra e Gerar {cardInstallmentsCount}x Parcelas</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE: SINGLE TRANSACTION */}
        {(modalTab === 'single' || transactionToEdit) && (
          <form onSubmit={handleSubmitSingle} className="mt-4 space-y-4">
            {/* Tipo: Despesa ou Receita */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Tipo de Lançamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="type-expense-btn"
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`py-2 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    type === 'expense'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs ring-2 ring-rose-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Despesa (Gasto)
                </button>
                <button
                  id="type-income-btn"
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`py-2 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    type === 'income'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-2 ring-emerald-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Receita (Ganho)
                </button>
              </div>

              {/* Shortcuts for Salary if Income is selected */}
              {type === 'income' && !transactionToEdit && (
                <div className="mt-2.5 p-2 bg-emerald-50/60 rounded-xl border border-emerald-200/70 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] font-semibold text-emerald-900">Preenchimento rápido:</span>
                  <button
                    type="button"
                    onClick={() => handleApplySalaryPreset('salario_5')}
                    className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    💰 Salário (5º Dia Útil)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySalaryPreset('adiantamento')}
                    className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    📅 Adiantamento Salarial (Vale)
                  </button>
                </div>
              )}
            </div>

            {/* Descrição e Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="tx-description" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Descrição *
                </label>
                <input
                  id="tx-description"
                  type="text"
                  placeholder="Ex: Salário (5º Dia Útil), Adiantamento, Supermercado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-100 text-sm transition-colors text-slate-800"
                  required
                />
              </div>
              <div>
                <label htmlFor="tx-amount" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Valor (R$) *
                </label>
                <input
                  id="tx-amount"
                  type="text"
                  placeholder="0,00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-100 text-sm font-semibold transition-colors text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Categoria e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tx-category" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Categoria *
                </label>
                <select
                  id="tx-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-100 text-sm bg-white text-slate-800"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tx-date" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Data *
                </label>
                <input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-100 text-sm bg-white text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Forma de Pagamento e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tx-payment" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Método de Pagamento
                </label>
                <select
                  id="tx-payment"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-100 text-sm bg-white text-slate-800"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tx-status" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Status do Lançamento
                </label>
                <select
                  id="tx-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-100 text-sm bg-white text-slate-800"
                >
                  <option value="completed">Concluído / Pago / Recebido</option>
                  <option value="pending">Pendente / Agendado</option>
                </select>
              </div>
            </div>

            {/* Atalho inteligente para parcelamento caso o método seja cartão */}
            {paymentMethod === 'credit_card' && type === 'expense' && !transactionToEdit && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-950 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Vai parcelar esta compra no cartão em 2x, 6x ou até 48x?</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (description) setCardDescription(description);
                    if (amountStr) setCardTotalAmountStr(amountStr);
                    if (category) setCardCategory(category);
                    setModalTab('installments');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  Ativar Parcelamento
                </button>
              </div>
            )}

            {/* Observações */}
            <div>
              <label htmlFor="tx-notes" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Observações (Opcional)
              </label>
              <input
                id="tx-notes"
                type="text"
                placeholder="Ex: Parcela do adiantamento, comprovante bancário..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-100 text-sm text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {transactionToEdit && onDelete ? (
                <button
                  id="tx-delete-modal-btn"
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja excluir esta transação "${transactionToEdit.description}"?`)) {
                      onDelete(transactionToEdit.id);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Transação</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  id="tx-cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="tx-save-btn"
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {transactionToEdit ? 'Salvar Alterações' : 'Adicionar Transação'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
