import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  BellRing,
  Volume2,
  VolumeX,
  Trash2,
  Edit3,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  Flame,
  Target,
  Zap,
  Award,
} from 'lucide-react';
import { DailyCommitment, CommitmentType, GoalItem, GoalTimeframe, CoupleMember } from '../types.ts';
import { formatDateBR } from '../utils/formatters.ts';
import {
  isSoundAlertEnabled,
  setSoundAlertEnabled,
  testSoundAlert,
  playCheckmarkSound,
} from '../utils/audioAlert.ts';
import { ObjectivesView } from './ObjectivesView.tsx';
import { GoalModal } from './GoalModal.tsx';

interface AgendaViewProps {
  commitments: DailyCommitment[];
  onToggleComplete: (id: string) => void;
  onOpenNewModal: (type?: CommitmentType, date?: string) => void;
  onEditCommitment: (commitment: DailyCommitment) => void;
  onDeleteCommitment: (id: string) => void;
  onClearCompleted: () => void;
  onRestoreDefaults: () => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  goals?: GoalItem[];
  onSaveGoal?: (goal: GoalItem) => void;
  onToggleGoal?: (id: string) => void;
  onDeleteGoal?: (id: string) => void;
  activeProfile?: CoupleMember;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  commitments,
  onToggleComplete,
  onOpenNewModal,
  onEditCommitment,
  onDeleteCommitment,
  onClearCompleted,
  onRestoreDefaults,
  selectedDate,
  onDateChange,
  goals = [],
  onSaveGoal,
  onToggleGoal,
  onDeleteGoal,
  activeProfile = 'andrews',
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'goals'>('daily');
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<GoalItem | null>(null);
  const [defaultGoalTimeframe, setDefaultGoalTimeframe] = useState<GoalTimeframe>('monthly');

  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [memberFilter, setMemberFilter] = useState<'all' | 'andrews' | 'rayssa'>('all');
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundAlertEnabled());

  const pendingGoalsCount = useMemo(() => {
    return goals.filter((g) => !g.completed).length;
  }, [goals]);

  const handleOpenNewGoal = (timeframe: GoalTimeframe = 'monthly') => {
    setGoalToEdit(null);
    setDefaultGoalTimeframe(timeframe);
    setIsGoalModalOpen(true);
  };

  const handleEditGoal = (goal: GoalItem) => {
    setGoalToEdit(goal);
    setDefaultGoalTimeframe(goal.timeframe);
    setIsGoalModalOpen(true);
  };

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayStr();
  const isToday = selectedDate === todayStr;

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundAlertEnabled(next);
  };

  const handleCheckWithSound = (comm: DailyCommitment) => {
    if (!comm.completed) {
      playCheckmarkSound();
    }
    onToggleComplete(comm.id);
  };

  const dayCommitments = useMemo(() => {
    return commitments.filter((c) => c.date === selectedDate);
  }, [commitments, selectedDate]);

  const stats = useMemo(() => {
    const total = dayCommitments.length;
    const completed = dayCommitments.filter((c) => c.completed).length;
    const pending = total - completed;
    const emergencies = dayCommitments.filter((c) => c.type === 'emergency' && !c.completed).length;
    const appointments = dayCommitments.filter((c) => c.type === 'appointment' && !c.completed).length;
    const tasks = dayCommitments.filter((c) => c.type === 'task' && !c.completed).length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, emergencies, appointments, tasks, progressPercent };
  }, [dayCommitments]);

  const filteredCommitments = useMemo(() => {
    return dayCommitments
      .filter((c) => {
        if (filterType !== 'all' && c.type !== filterType) return false;
        if (filterStatus === 'pending' && c.completed) return false;
        if (filterStatus === 'completed' && !c.completed) return false;
        if (memberFilter === 'andrews') {
          const isAndrews = c.member === 'andrews' || c.title.toLowerCase().includes('andrews');
          if (!isAndrews && c.member !== 'both') return false;
        } else if (memberFilter === 'rayssa') {
          const isRayssa = c.member === 'rayssa' || c.title.toLowerCase().includes('rayssa');
          if (!isRayssa && c.member !== 'both') return false;
        }
        return true;
      })
      .sort((a, b) => {
        // 1. Pending first
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // 2. Emergencies first
        if (a.type === 'emergency' && b.type !== 'emergency') return -1;
        if (b.type === 'emergency' && a.type !== 'emergency') return 1;
        // 3. Time ascending
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });
  }, [dayCommitments, filterType, filterStatus]);

  const handleStepDay = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + delta);
    const ny = dateObj.getFullYear();
    const nm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const nd = String(dateObj.getDate()).padStart(2, '0');
    onDateChange(`${ny}-${nm}-${nd}`);
  };

  return (
    <div id="agenda-view-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation Switcher: Socorros do Dia vs Metas & Objetivos */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="tab-agenda-daily"
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-500" />
            <span>Socorros & Compromissos do Dia</span>
            {stats.emergencies > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                {stats.emergencies}
              </span>
            )}
          </button>

          <button
            id="tab-agenda-goals"
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 py-2.5 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'goals'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4 text-amber-500" />
            <span>Metas & Objetivos</span>
            {pendingGoalsCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                {pendingGoalsCount}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-normal">
                (Semanal, Mensal, Anual)
              </span>
            )}
          </button>
        </div>

        {activeTab === 'goals' ? (
          <button
            id="btn-add-goal-top"
            type="button"
            onClick={() => handleOpenNewGoal('monthly')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Objetivo</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto px-2">
            <span>Hoje:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
              {formatDateBR(todayStr)}
            </span>
          </div>
        )}
      </div>

      {/* Mode 1: Metas & Objetivos (Semanais, Mensais, Anuais) */}
      {activeTab === 'goals' ? (
        <ObjectivesView
          goals={goals}
          onToggleGoal={onToggleGoal || (() => {})}
          onOpenNewGoalModal={handleOpenNewGoal}
          onEditGoal={handleEditGoal}
          onDeleteGoal={onDeleteGoal || (() => {})}
          activeProfile={activeProfile}
        />
      ) : (
        /* Mode 2: Socorros do Dia & Agenda Diária */
        <div className="space-y-6">
          {/* Top Banner: Day Navigation & Sound Control */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Flame className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Socorros do Dia & Agenda de Compromissos
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Marque seus socorros urgentes, consultas e tarefas diárias com visto de feito e alerta sonoro automático.
            </p>
          </div>

          {/* Sound Controls & Add Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-toggle-sound"
              type="button"
              onClick={handleToggleSound}
              title={soundActive ? 'Desativar apito sonoro' : 'Ativar apito sonoro'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                soundActive
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {soundActive ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{soundActive ? 'Apito Sonoro: Ligado' : 'Apito: Mudo'}</span>
            </button>

            <button
              id="btn-test-sound"
              type="button"
              onClick={testSoundAlert}
              title="Testar alarme sonoro agora no alto-falante"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 text-indigo-600" />
              <span>Testar Apito</span>
            </button>

            {/* Quick Add Emergency */}
            <button
              id="btn-new-emergency"
              type="button"
              onClick={() => onOpenNewModal('emergency', selectedDate)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>+ Novo Socorro</span>
            </button>

            {/* Quick Add Appointment */}
            <button
              id="btn-new-commitment"
              type="button"
              onClick={() => onOpenNewModal('appointment', selectedDate)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Compromisso / Tarefa</span>
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStepDay(-1)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              ◀ Dia Anterior
            </button>
            <button
              type="button"
              onClick={() => onDateChange(todayStr)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                isToday
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handleStepDay(1)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              Próximo Dia ▶
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="agenda-date-picker" className="text-xs font-semibold text-slate-600">
              Escolher Data:
            </label>
            <input
              id="agenda-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-1 text-xs font-bold border border-slate-300 rounded-lg text-slate-800 bg-white"
            />
            <span className="text-xs font-bold text-slate-800 hidden sm:inline">
              ({formatDateBR(selectedDate)})
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid for Daily Commitments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Socorros Pendentes */}
        <div className="p-4 bg-white rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              🚨 Socorros do Dia
            </span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">
              {stats.emergencies}
            </span>
            <span className="text-[11px] text-slate-500">
              {stats.emergencies > 0 ? 'Exigem ação urgente hoje!' : 'Nenhum socorro pendente'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className={`w-6 h-6 ${stats.emergencies > 0 ? 'animate-bounce' : ''}`} />
          </div>
        </div>

        {/* Compromissos com horário */}
        <div className="p-4 bg-white rounded-2xl border border-indigo-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
              📅 Compromissos
            </span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">
              {stats.appointments}
            </span>
            <span className="text-[11px] text-slate-500">Com horário e apito agendado</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Tarefas / Afazeres */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              📝 Tarefas a Fazer
            </span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {stats.tasks}
            </span>
            <span className="text-[11px] text-slate-500">Para dar visto de feito</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Progresso Diário / Vistos */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              ✅ Vistos do Dia
            </span>
            <span className="text-xs font-bold text-emerald-700">
              {stats.completed}/{stats.total} feitos ({stats.progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500">
            {stats.completed === stats.total && stats.total > 0
              ? 'Tudo concluído por hoje! Parabéns 🎉'
              : `${stats.pending} item(ns) aguardando seu visto`}
          </span>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Type filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'emergency', label: '🚨 Socorros' },
            { id: 'appointment', label: '📅 Compromissos' },
            { id: 'task', label: '✅ Tarefas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Member filter (Andrews vs Rayssa) */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
          <button
            type="button"
            onClick={() => setMemberFilter('all')}
            className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
              memberFilter === 'all' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👫 Casal
          </button>
          <button
            type="button"
            onClick={() => setMemberFilter('andrews')}
            className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
              memberFilter === 'andrews' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-blue-700'
            }`}
          >
            👨‍💼 Andrews
          </button>
          <button
            type="button"
            onClick={() => setMemberFilter('rayssa')}
            className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
              memberFilter === 'rayssa' ? 'bg-purple-600 text-white shadow-2xs font-bold' : 'text-slate-500 hover:text-purple-700'
            }`}
          >
            👩‍💼 Rayssa
          </button>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === 'pending' ? 'bg-white shadow-2xs text-amber-700' : 'text-slate-500'
              }`}
            >
              Pendentes
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === 'completed' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-500'
              }`}
            >
              Concluídos
            </button>
          </div>

          {stats.completed > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              title="Excluir tarefas já concluídas para despoluir a lista"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Commitments List */}
      <div className="space-y-3">
        {filteredCommitments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Nenhum item encontrado para esta data
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Você pode registrar seus socorros urgentes, compromissos com horário ou afazeres diários para dar visto.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onOpenNewModal('emergency', selectedDate)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + Adicionar Socorro do Dia
              </button>
              <button
                type="button"
                onClick={() => onOpenNewModal('appointment', selectedDate)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + Adicionar Compromisso
              </button>
              <button
                type="button"
                onClick={onRestoreDefaults}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Carregar Exemplos
              </button>
            </div>
          </div>
        ) : (
          filteredCommitments.map((comm) => {
            const isEmergency = comm.type === 'emergency';
            const isAppointment = comm.type === 'appointment';

            return (
              <div
                key={comm.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  comm.completed
                    ? 'bg-slate-50/70 border-slate-200 opacity-80'
                    : isEmergency
                    ? 'border-rose-300 ring-1 ring-rose-200/50 bg-rose-50/20'
                    : isAppointment
                    ? 'border-indigo-200 hover:border-indigo-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Checkmark Button + Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Big Satisfying Check Button */}
                  <button
                    type="button"
                    onClick={() => handleCheckWithSound(comm)}
                    title={comm.completed ? 'Clique para reabrir este item' : 'Clique para dar visto (feito!)'}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer mt-0.5 ${
                      comm.completed
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600'
                    }`}
                  >
                    <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${comm.completed ? 'stroke-[3]' : ''}`} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Badge: Type */}
                      {isEmergency && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Socorro do Dia
                        </span>
                      )}
                      {isAppointment && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Calendar className="w-3 h-3 text-indigo-600" />
                          Compromisso
                        </span>
                      )}
                      {comm.type === 'task' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Tarefa
                        </span>
                      )}

                      {/* Time */}
                      {comm.time && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-extrabold bg-slate-100 text-slate-800">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {comm.time}
                        </span>
                      )}

                      {/* Member badge */}
                      {comm.member === 'rayssa' || comm.title.toLowerCase().includes('rayssa') ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          👩‍💼 Rayssa
                        </span>
                      ) : comm.member === 'andrews' || comm.title.toLowerCase().includes('andrews') ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          👨‍💼 Andrews
                        </span>
                      ) : comm.member === 'both' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          👫 Casal
                        </span>
                      ) : null}

                      {/* Sound alert badge */}
                      {comm.soundEnabled && !comm.completed && (
                        <span
                          title={`Apito sonoro ativado (${comm.soundAlertMinutesBefore ?? 0} min antes)`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                        >
                          <BellRing className="w-3 h-3 text-amber-600 animate-pulse" />
                          {comm.soundAlertMinutesBefore === 0
                            ? 'Apita na hora'
                            : `Apita ${comm.soundAlertMinutesBefore}m antes`}
                        </span>
                      )}

                      {/* Location */}
                      {comm.location && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {comm.location}
                        </span>
                      )}
                    </div>

                    {/* Title with strikethrough if completed */}
                    <h4
                      className={`text-sm sm:text-base font-bold text-slate-900 transition-colors ${
                        comm.completed ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {comm.title}
                    </h4>

                    {/* Notes */}
                    {comm.notes && (
                      <p
                        className={`text-xs text-slate-500 mt-0.5 line-clamp-2 ${
                          comm.completed ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {comm.notes}
                      </p>
                    )}

                    {/* Completion timestamp */}
                    {comm.completed && (
                      <span className="inline-block mt-1 text-[11px] text-emerald-600 font-medium">
                        ✓ Visto dado em {formatDateBR(comm.date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCheckWithSound(comm)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      comm.completed
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {comm.completed ? 'Desmarcar' : 'Dar Visto ✓'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditCommitment(comm)}
                    title="Editar informações"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteCommitment(comm.id)}
                    title="Excluir item"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Card: Teaser / Link to Goals & Objectives */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
            <Target className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Planejamento de Objetivos (Semanais, Mensais & Anuais)
            </h4>
            <p className="text-xs text-amber-900/80 mt-0.5">
              {pendingGoalsCount > 0
                ? `Você tem ${pendingGoalsCount} objetivo(s) em andamento (ex: arrumar o carro, comprar um tênis, construir o muro).`
                : 'Cadastre suas metas para a semana, mês ou ano e acompanhe suas conquistas!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenNewGoal('weekly')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 text-amber-900 text-xs font-bold border border-amber-300 transition-colors cursor-pointer"
          >
            + Nova Meta
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Abrir Metas →
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Goal Modal (Criar / Editar Objetivos) */}
  <GoalModal
    isOpen={isGoalModalOpen}
    onClose={() => setIsGoalModalOpen(false)}
    onSave={(goal) => {
      if (onSaveGoal) onSaveGoal(goal);
    }}
    onDelete={(id) => {
      if (onDeleteGoal) onDeleteGoal(id);
      setIsGoalModalOpen(false);
    }}
    goalToEdit={goalToEdit}
    defaultTimeframe={defaultGoalTimeframe}
    activeProfile={activeProfile}
  />
</div>
);
};
