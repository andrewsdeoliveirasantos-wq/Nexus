import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  Clock,
  BellRing,
  Volume2,
  CheckCircle2,
  MapPin,
  FileText,
  Sparkles,
} from 'lucide-react';
import { DailyCommitment, CommitmentType, CommitmentPriority } from '../types.ts';
import { unlockAudio, playAppointmentAlertSound } from '../utils/audioAlert.ts';

interface CommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (commitment: DailyCommitment) => void;
  commitmentToEdit?: DailyCommitment | null;
  defaultDate?: string;
  defaultType?: CommitmentType;
  activeProfile?: 'andrews' | 'rayssa' | 'both';
}

export const CommitmentModal: React.FC<CommitmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  commitmentToEdit,
  defaultDate,
  defaultType = 'emergency',
  activeProfile = 'andrews',
}) => {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [type, setType] = useState<CommitmentType>(defaultType);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<CommitmentPriority>('urgent');
  const [date, setDate] = useState(defaultDate || getTodayStr());
  const [time, setTime] = useState('');
  const [member, setMember] = useState<'andrews' | 'rayssa' | 'both'>(activeProfile);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundAlertMinutesBefore, setSoundAlertMinutesBefore] = useState<number>(10);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (commitmentToEdit) {
      setType(commitmentToEdit.type);
      setTitle(commitmentToEdit.title);
      setPriority(commitmentToEdit.priority);
      setDate(commitmentToEdit.date);
      setTime(commitmentToEdit.time || '');
      setMember(commitmentToEdit.member || activeProfile || 'andrews');
      setSoundEnabled(commitmentToEdit.soundEnabled ?? true);
      setSoundAlertMinutesBefore(commitmentToEdit.soundAlertMinutesBefore ?? 10);
      setLocation(commitmentToEdit.location || '');
      setNotes(commitmentToEdit.notes || '');
    } else {
      setType(defaultType);
      setTitle('');
      setPriority(defaultType === 'emergency' ? 'urgent' : defaultType === 'appointment' ? 'high' : 'normal');
      setDate(defaultDate || getTodayStr());
      setMember(activeProfile || 'andrews');
      
      // Default to next rounded hour
      const now = new Date();
      const nextHour = (now.getHours() + 1) % 24;
      setTime(`${String(nextHour).padStart(2, '0')}:00`);

      setSoundEnabled(true);
      setSoundAlertMinutesBefore(defaultType === 'emergency' ? 5 : 15);
      setLocation('');
      setNotes('');
    }
    setError('');
  }, [commitmentToEdit, isOpen, defaultDate, defaultType]);

  if (!isOpen) return null;

  const handleTestSound = (e: React.MouseEvent) => {
    e.preventDefault();
    unlockAudio();
    playAppointmentAlertSound();
  };

  const handleSetQuickTime = (hours: number, minutes: number) => {
    setTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  const handleAddMinutes = (mins: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + mins);
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Por favor, informe uma descrição para o compromisso ou socorro.');
      return;
    }

    if (!date) {
      setError('Por favor, informe a data.');
      return;
    }

    const commitment: DailyCommitment = {
      id: commitmentToEdit ? commitmentToEdit.id : `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: cleanTitle,
      type,
      priority,
      date,
      time: time.trim() || undefined,
      completed: commitmentToEdit ? commitmentToEdit.completed : false,
      completedAt: commitmentToEdit?.completedAt,
      soundEnabled,
      soundAlertMinutesBefore: soundEnabled ? soundAlertMinutesBefore : 0,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: commitmentToEdit ? commitmentToEdit.createdAt : new Date().toISOString(),
      member,
    };

    unlockAudio();
    onSave(commitment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="commitment-modal-card"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                type === 'emergency'
                  ? 'bg-rose-100 text-rose-700'
                  : type === 'appointment'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {type === 'emergency' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : type === 'appointment' ? (
                <Calendar className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {commitmentToEdit
                  ? 'Editar Registro'
                  : type === 'emergency'
                  ? 'Novo Socorro do Dia'
                  : type === 'appointment'
                  ? 'Novo Compromisso'
                  : 'Nova Tarefa do Dia'}
              </h3>
              <p className="text-xs text-slate-500">
                {type === 'emergency'
                  ? 'Urgência imediata com alerta sonoro prioritário'
                  : type === 'appointment'
                  ? 'Compromisso com horário marcado e aviso sonoro'
                  : 'Afazer do cotidiano para dar visto de concluído'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* De quem é essa anotação / compromisso */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              De quem é este compromisso / anotação?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMember('andrews')}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  member === 'andrews'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>👨‍💼</span>
                <span>Andrews</span>
              </button>

              <button
                type="button"
                onClick={() => setMember('rayssa')}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  member === 'rayssa'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>👩‍💼</span>
                <span>Rayssa</span>
              </button>

              <button
                type="button"
                onClick={() => setMember('both')}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  member === 'both'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>👫</span>
                <span>Casal (Ambos)</span>
              </button>
            </div>
          </div>

          {/* Type Selector (Tabs) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Tipo do Registro
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('emergency');
                  setPriority('urgent');
                  setSoundAlertMinutesBefore(5);
                }}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'emergency'
                    ? 'bg-rose-50 text-rose-800 border-rose-400 ring-2 ring-rose-200 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Socorro / Urgência</span>
                </div>
                <span className="text-[10px] text-rose-600/80 font-normal">Prioridade Máxima</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('appointment');
                  setPriority('high');
                  setSoundAlertMinutesBefore(15);
                }}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'appointment'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Compromisso</span>
                </div>
                <span className="text-[10px] text-indigo-600/80 font-normal">Horário Marcado</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('task');
                  setPriority('normal');
                  setSoundEnabled(false);
                }}
                className={`py-2 px-2 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'task'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-200 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tarefa do Dia</span>
                </div>
                <span className="text-[10px] text-emerald-600/80 font-normal">Dar Check / Visto</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="comm-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              O que precisa ser feito? *
            </label>
            <input
              id="comm-title"
              type="text"
              placeholder={
                type === 'emergency'
                  ? 'Ex: Levar remédio urgente, consertar vazamento do cano...'
                  : type === 'appointment'
                  ? 'Ex: Consulta no dentista às 15h, Reunião da escola...'
                  : 'Ex: Fazer compras da feira, responder e-mails, limpar mesa...'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              required
              autoFocus
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="comm-date" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Data do Compromisso *
              </label>
              <div className="relative">
                <input
                  id="comm-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="comm-time" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Horário {type !== 'task' && <span className="text-rose-500">*</span>}
                </label>
                <span className="text-[10px] text-slate-400">Hora : Minuto</span>
              </div>
              <div className="relative">
                <input
                  id="comm-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Time Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">Atalhos de horário:</span>
            <button
              type="button"
              onClick={() => handleAddMinutes(15)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              +15 min
            </button>
            <button
              type="button"
              onClick={() => handleAddMinutes(30)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              +30 min
            </button>
            <button
              type="button"
              onClick={() => handleAddMinutes(60)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              +1 hora
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickTime(9, 0)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              09:00
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickTime(14, 30)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              14:30
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickTime(19, 0)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              19:00
            </button>
          </div>

          {/* Priority & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="comm-priority" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nível de Urgência
              </label>
              <select
                id="comm-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as CommitmentPriority)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 text-slate-900 bg-white"
              >
                <option value="urgent">🔴 Urgente (Socorro Imediato)</option>
                <option value="high">🟠 Alta Prioridade</option>
                <option value="normal">🔵 Normal / Padrão</option>
                <option value="low">🟢 Baixa (Quando puder)</option>
              </select>
            </div>

            <div>
              <label htmlFor="comm-location" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Local / Referência (Opcional)
              </label>
              <div className="relative">
                <input
                  id="comm-location"
                  type="text"
                  placeholder="Ex: Em casa, Consultório, Loja..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Sound Alert Configuration */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="comm-sound-enabled" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="comm-sound-enabled"
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-md border-amber-300 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-amber-700" />
                  Apitar sonoramente quando estiver próximo
                </span>
              </label>

              <button
                type="button"
                onClick={handleTestSound}
                title="Clique para testar o som do apito no seu dispositivo"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3 h-3 text-amber-800" />
                <span>Testar Som</span>
              </button>
            </div>

            {soundEnabled && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-amber-900">
                <span className="text-[11px] font-semibold text-amber-800">Tocar apito com antecedência de:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { val: 0, label: 'No horário exato' },
                    { val: 5, label: '5 min antes' },
                    { val: 10, label: '10 min antes' },
                    { val: 15, label: '15 min antes' },
                    { val: 30, label: '30 min antes' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setSoundAlertMinutesBefore(opt.val)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        soundAlertMinutesBefore === opt.val
                          ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                          : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="comm-notes" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações / Detalhes (Opcional)
            </label>
            <textarea
              id="comm-notes"
              rows={2}
              placeholder="Ex: Levar documento com foto, dinheiro trocado, código de rastreio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-commitment"
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                type === 'emergency'
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-98'
                  : type === 'appointment'
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{commitmentToEdit ? 'Salvar Alterações' : 'Adicionar à Agenda'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
