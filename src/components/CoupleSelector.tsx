import React from 'react';
import { User, Users, Heart, Cloud, Sparkles } from 'lucide-react';
import { CoupleMember } from '../types.ts';

interface CoupleSelectorProps {
  currentProfile: CoupleMember;
  onProfileChange: (member: CoupleMember) => void;
  selectedFilter: 'all' | 'andrews' | 'rayssa';
  onFilterChange: (filter: 'all' | 'andrews' | 'rayssa') => void;
  isOnlineSync?: boolean;
}

export const CoupleSelector: React.FC<CoupleSelectorProps> = ({
  currentProfile,
  onProfileChange,
  selectedFilter,
  onFilterChange,
  isOnlineSync = true,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-800 text-xs">
      {/* Quem está usando este celular / dispositivo */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span>Celular de:</span>
        </span>

        <div className="inline-flex rounded-xl bg-white/10 p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => onProfileChange('andrews')}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              currentProfile === 'andrews'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>👨‍💼</span>
            <span>Andrews</span>
          </button>

          <button
            type="button"
            onClick={() => onProfileChange('rayssa')}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              currentProfile === 'rayssa'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>👩‍💼</span>
            <span>Rayssa</span>
          </button>
        </div>
      </div>

      {/* Filtro de exibição na tela: Andrews, Rayssa ou Casal */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 font-medium">Visualizar:</span>
        <div className="inline-flex rounded-xl bg-white/10 p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer flex items-center gap-1 ${
              selectedFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Casal (Tudo)</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('andrews')}
            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              selectedFilter === 'andrews'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Andrews
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('rayssa')}
            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              selectedFilter === 'rayssa'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Rayssa
          </button>
        </div>

        {/* Status de Sincronização em Nuvem */}
        <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-white/15 text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Cloud className="w-3.5 h-3.5" />
          <span>Nuvem Ativa</span>
        </div>
      </div>
    </div>
  );
};
