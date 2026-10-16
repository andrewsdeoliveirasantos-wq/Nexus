import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Sparkles,
  Calendar,
  DollarSign,
  User,
  Tag,
  CheckCircle2,
  FileText,
  Trash2,
} from 'lucide-react';
import { GoalItem, GoalTimeframe, CoupleMember, CommitmentPriority } from '../types.ts';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: GoalItem) => void;
  onDelete?: (id: string) => void;
  goalToEdit?: GoalItem | null;
  defaultTimeframe?: GoalTimeframe;
  activeProfile?: CoupleMember;
}

const QUICK_SUGGESTIONS = [
  { title: 'Arrumar o carro', timeframe: 'weekly' as GoalTimeframe, category: 'Veículo' },
  { title: 'Comprar um tênis', timeframe: 'monthly' as GoalTimeframe, category: 'Pessoal' },
  { title: 'Construir um muro', timeframe: 'yearly' as GoalTimeframe, category: 'Casa & Obra' },
  { title: 'Revisão mecânica do carro', timeframe: 'monthly' as GoalTimeframe, category: 'Veículo' },
  { title: 'Comprar móveis novos', timeframe: 'yearly' as GoalTimeframe, category: 'Casa & Obra' },
  { title: 'Economizar reserva de emergência', timeframe: 'yearly' as GoalTimeframe, category: 'Finanças' },
];

const CATEGORIES = [
  'Casa, Reforma & Obra',
  'Veículo & Transporte',
  'Pessoal, Vestuário & Compras',
  'Família & Lazer',
  'Finanças & Economia',
  'Saúde & Bem-estar',
  'Geral & Outros',
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  goalToEdit,
  defaultTimeframe = 'monthly',
  activeProfile = 'andrews',
}) => {
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [timeframe, setTimeframe] = useState<GoalTimeframe>(defaultTimeframe);
  const [category, setCategory] = useState('Casa, Reforma & Obra');
  const [member, setMember] = useState<CoupleMember>(activeProfile);
  const [priority, setPriority] = useState<CommitmentPriority>('normal');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [savedAmountStr, setSavedAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setTimeframe(goalToEdit.timeframe);
      setCategory(goalToEdit.category || 'Casa, Reforma & Obra');
      setMember(goalToEdit.member || activeProfile);
      setPriority(goalToEdit.priority || 'normal');
      setTargetAmountStr(goalToEdit.targetAmount ? goalToEdit.targetAmount.toFixed(2).replace('.', ',') : '');
      setSavedAmountStr(goalToEdit.savedAmount ? goalToEdit.savedAmount.toFixed(2).replace('.', ',') : '');
      setTargetDate(goalToEdit.targetDate || '');
      setNotes(goalToEdit.notes || '');
    } else {
      setTitle('');
      setTimeframe(defaultTimeframe);
      setCategory('Casa, Reforma & Obra');
      setMember(activeProfile);
      setPriority('normal');
      setTargetAmountStr('');
      setSavedAmountStr('');
      setTargetDate('');
      setNotes('');
    }
  }, [isOpen, goalToEdit, defaultTimeframe, activeProfile]);

  if (!isOpen) return null;

  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleApplySuggestion = (sug: typeof QUICK_SUGGESTIONS[0]) => {
    setTitle(sug.title);
    setTimeframe(sug.timeframe);
    if (sug.category) setCategory(sug.category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    const tAmount = parseNumber(targetAmountStr);
    const sAmount = parseNumber(savedAmountStr);

    const goalData: GoalItem = {
      id: goalToEdit ? goalToEdit.id : `goal-${Date.now()}`,
      title: title.trim(),
      timeframe,
      category,
      member,
      priority,
      targetAmount: tAmount > 0 ? tAmount : undefined,
      savedAmount: sAmount > 0 ? sAmount : undefined,
      targetDate: targetDate || undefined,
      completed: goalToEdit ? goalToEdit.completed : false,
      completedAt: goalToEdit ? goalToEdit.completedAt : undefined,
      notes: notes.trim() || undefined,
      createdAt: goalToEdit ? goalToEdit.createdAt : new Date().toISOString(),
    };

    onSave(goalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {goalToEdit ? 'Editar Objetivo' : 'Novo Objetivo ou Meta'}
              </h3>
              <p className="text-[11px] text-amber-100">
                Planeje conquistas semanais, mensais ou do ano para o casal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick Suggestions (if creating new) */}
          {!goalToEdit && (
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Exemplos Rápidos (Clique para preencher):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.title}
                    type="button"
                    onClick={() => handleApplySuggestion(sug)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium transition-colors cursor-pointer text-left"
                  >
                    + {sug.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              O que você quer cumprir / conquistar? *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Arrumar o carro, Comprar um tênis, Construir o muro..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(false);
              }}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-colors ${
                titleError ? 'border-rose-500 focus:border-rose-600' : 'border-slate-300 focus:border-amber-500'
              }`}
            />
            {titleError && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                Por favor, informe o título do objetivo ou meta.
              </p>
            )}
          </div>

          {/* Timeframe Selector (Semanal, Mensal, Anual) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Período / Alcance da Meta *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTimeframe('weekly')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                  timeframe === 'weekly'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">⚡</span>
                <span className="mt-0.5">Semanal</span>
                <span className="text-[10px] text-slate-400 font-normal">Esta semana</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('monthly')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                  timeframe === 'monthly'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">🗓️</span>
                <span className="mt-0.5">Mensal</span>
                <span className="text-[10px] text-slate-400 font-normal">Neste mês</span>
              </button>

              <button
                type="button"
                onClick={() => setTimeframe('yearly')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                  timeframe === 'yearly'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">🏆</span>
                <span className="mt-0.5">Anual</span>
                <span className="text-[10px] text-slate-400 font-normal">Meta do ano</span>
              </button>
            </div>
          </div>

          {/* Member assignment */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>De quem é este objetivo?</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMember('andrews')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  member === 'andrews'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👨‍💼</span>
                <span>Andrews</span>
              </button>

              <button
                type="button"
                onClick={() => setMember('rayssa')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  member === 'rayssa'
                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👩‍💼</span>
                <span>Rayssa</span>
              </button>

              <button
                type="button"
                onClick={() => setMember('both')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  member === 'both'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>👫</span>
                <span>Casal</span>
              </button>
            </div>
          </div>

          {/* Category & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-500" />
                <span>Categoria</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Prazo Final (Opcional)</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Financial Values (Optional) */}
          <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <DollarSign className="w-4 h-4 text-amber-700" />
              <span>Valores Financeiros (Opcional para compras ou obras)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Custo Estimado / Meta (R$)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 3.500,00"
                  value={targetAmountStr}
                  onChange={(e) => setTargetAmountStr(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Já Economizado / Pago (R$)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1.000,00"
                  value={savedAmountStr}
                  onChange={(e) => setSavedAmountStr(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
            <p className="text-[10px] text-amber-900/70">
              Deixe em branco caso seja um objetivo de afazer pessoal sem custo financeiro.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Observações, passos ou cotações</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Orçamento do material de construção, pedreiro contatado, modelo do tênis..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2.5">
            {goalToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(goalToEdit.id);
                  onClose();
                }}
                className="px-3.5 py-2.5 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Excluir este objetivo/meta"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Excluir Meta</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{goalToEdit ? 'Salvar Alterações' : 'Criar Objetivo'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
