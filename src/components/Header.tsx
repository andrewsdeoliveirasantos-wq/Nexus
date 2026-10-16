import React, { useState, useRef } from 'react';
import {
  Wallet,
  Home,
  Receipt,
  FileBarChart2,
  PlusCircle,
  RotateCcw,
  Download,
  Calendar,
  Trash2,
  Sparkles,
  CreditCard,
  Flame,
  Plus,
  Heart,
  Users,
  Cloud,
  Camera,
} from 'lucide-react';
import { ViewTab, CoupleMember } from '../types.ts';
import { formatMonthName } from '../utils/formatters.ts';

interface HeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  selectedMonth: string;
  availableMonths: string[];
  onMonthChange: (month: string) => void;
  onOpenNewTransaction: () => void;
  onOpenNewInstallment?: () => void;
  onOpenNewCommitment?: () => void;
  pendingCommitmentsCount?: number;
  pendingEmergenciesCount?: number;
  onOpenQuickSetup?: () => void;
  onOpenCoupleSalaries?: () => void;
  onResetData: () => void;
  onClearDemoData?: () => void;
  onClearAllData?: () => void;
  hasDemoTransactions?: boolean;
  onExportData: () => void;
  totalBalance: number;
  currentProfile?: CoupleMember;
  onProfileChange?: (p: CoupleMember) => void;
  selectedMemberFilter?: 'all' | 'andrews' | 'rayssa';
  onMemberFilterChange?: (f: 'all' | 'andrews' | 'rayssa') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  selectedMonth,
  availableMonths,
  onMonthChange,
  onOpenNewTransaction,
  onOpenNewInstallment,
  onOpenNewCommitment,
  pendingCommitmentsCount = 0,
  pendingEmergenciesCount = 0,
  onOpenQuickSetup,
  onOpenCoupleSalaries,
  onResetData,
  onClearDemoData,
  onClearAllData,
  hasDemoTransactions,
  onExportData,
  totalBalance,
  currentProfile = 'andrews',
  onProfileChange,
  selectedMemberFilter = 'all',
  onMemberFilterChange,
}) => {
  // Check active tab normalizations
  const isHomeActive = currentTab === 'home';
  const isAgendaActive = currentTab === 'agenda';
  const isTransactionsActive = currentTab === 'transactions';
  const isInstallmentsActive = currentTab === 'installments';
  const isReportsActive = currentTab === 'reports' || currentTab === 'monthly_report';

  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('financas_app_logo') || '/app-logo.jpg';
    } catch {
      return '/app-logo.jpg';
    }
  });
  const [logoFailed, setLogoFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoUrl(result);
        setLogoFailed(false);
        try {
          localStorage.setItem('financas_app_logo', result);
        } catch (err) {
          console.warn('Erro ao salvar logotipo no localStorage:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar: Brand, Month Selector & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3 select-none">
            {/* Logo do Aplicativo */}
            <div className="relative group/logo">
              <div
                onClick={() => onTabChange('home')}
                className="w-11 h-11 rounded-2xl overflow-hidden shadow-xs ring-1 ring-slate-900/10 group-hover/logo:scale-105 group-hover/logo:shadow-md transition-all shrink-0 bg-slate-900 cursor-pointer flex items-center justify-center"
                title="Página inicial • Clique na câmera para trocar o logotipo se desejar"
              >
                {!logoFailed ? (
                  <img
                    src={logoUrl}
                    alt="Logotipo NEXUS"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-900 to-purple-900 text-white flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                  </div>
                )}
              </div>

              {/* Botão sutil para trocar logotipo */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                title="Trocar imagem do logotipo"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs opacity-75 hover:opacity-100 hover:scale-110 transition-all border border-white cursor-pointer"
              >
                <Camera className="w-2.5 h-2.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
              />
            </div>

            <div
              onClick={() => onTabChange('home')}
              className="cursor-pointer group select-none"
            >
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-wider group-hover:text-indigo-600 transition-colors uppercase font-sans">
                  NEXUS
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  👫 Andrews & Rayssa
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-tight">
                couple finance & life management
              </p>
            </div>
          </div>

          {/* Month selector & Global Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <label htmlFor="header-month-select" className="sr-only">
                Selecione o mês
              </label>
              <select
                id="header-month-select"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthName(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick action: Salários do Casal */}
            {onOpenCoupleSalaries && (
              <button
                type="button"
                onClick={onOpenCoupleSalaries}
                title="Configurar salários de Andrews e Rayssa"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Salários Casal</span>
              </button>
            )}

            {/* Quick action: + Socorro */}
            {onOpenNewCommitment && (
              <button
                id="header-new-commitment-btn"
                type="button"
                onClick={onOpenNewCommitment}
                title="Anotar um socorro do dia ou compromisso urgente"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">+ Socorro</span>
              </button>
            )}

            {/* Quick action: + Lançamento */}
            <button
              id="header-new-tx-btn"
              type="button"
              onClick={onOpenNewTransaction}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Lançamento</span>
            </button>

            {/* Utility Actions (Zerar Tudo, Export & Reset) */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              {onClearAllData && (
                <button
                  id="header-clear-all-btn"
                  type="button"
                  onClick={onClearAllData}
                  title="Zerar tudo para começar do zero"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200/80 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Zerar Tudo</span>
                </button>
              )}

              <button
                id="header-export-btn"
                type="button"
                onClick={onExportData}
                title="Exportar backup dos dados em JSON"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                id="header-reset-btn"
                type="button"
                onClick={onResetData}
                title="Carregar dados de exemplo (demonstração)"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Real Pages Navigation Tabs ("tipo páginas") */}
        <nav aria-label="Navegação de Páginas" className="flex items-center gap-1 pt-1.5 pb-1 overflow-x-auto no-scrollbar">
          {/* Página 1: Início */}
          <button
            id="nav-tab-home"
            type="button"
            onClick={() => onTabChange('home')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              isHomeActive
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Início</span>
          </button>

          {/* Página 2: Agenda, Socorros & Metas */}
          <button
            id="nav-tab-agenda"
            type="button"
            onClick={() => onTabChange('agenda')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              isAgendaActive
                ? 'bg-rose-50 text-rose-950 border border-rose-300 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Agenda, Socorros & Metas</span>
            {pendingEmergenciesCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                {pendingEmergenciesCount}
              </span>
            ) : pendingCommitmentsCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                {pendingCommitmentsCount}
              </span>
            ) : null}
          </button>

          {/* Página 3: Finanças & Lançamentos */}
          <button
            id="nav-tab-transactions"
            type="button"
            onClick={() => onTabChange('transactions')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              isTransactionsActive
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Finanças & Lançamentos</span>
          </button>

          {/* Página 4: Cartão & Parcelas */}
          <button
            id="nav-tab-installments"
            type="button"
            onClick={() => onTabChange('installments')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              isInstallmentsActive
                ? 'bg-indigo-50 text-indigo-950 border border-indigo-300 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cartão & Parcelas</span>
          </button>

          {/* Página 5: Gráficos & Relatórios */}
          <button
            id="nav-tab-reports"
            type="button"
            onClick={() => onTabChange('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              isReportsActive
                ? 'bg-sky-50 text-sky-950 border border-sky-300 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <FileBarChart2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Gráficos & Relatórios</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
