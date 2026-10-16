import React, { useMemo } from 'react';
import {
  CreditCard,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Transaction, InstallmentGroup } from '../types.ts';
import { CreditCardInstallmentsCard } from './CreditCardInstallmentsCard.tsx';
import { groupInstallmentPurchases, calculateDueAlerts } from '../utils/installments.ts';
import { formatCurrency, formatDateBR } from '../utils/formatters.ts';

interface InstallmentsPageProps {
  transactions: Transaction[];
  onOpenNewInstallment: () => void;
  onToggleStatus: (transactionId: string) => void;
  onDeleteGroup: (groupId: string, title: string) => void;
}

export const InstallmentsPage: React.FC<InstallmentsPageProps> = ({
  transactions,
  onOpenNewInstallment,
  onToggleStatus,
  onDeleteGroup,
}) => {
  const groups = useMemo(() => {
    return groupInstallmentPurchases(transactions);
  }, [transactions]);

  const dueAlerts = useMemo(() => {
    return calculateDueAlerts(transactions).filter((a) => a.isInstallment);
  }, [transactions]);

  const totalCardDebt = groups.reduce((acc, g) => acc + g.remainingAmount, 0);
  const totalPaidDebt = groups.reduce((acc, g) => acc + g.paidAmount, 0);
  const totalOriginalAmount = groups.reduce((acc, g) => acc + g.totalAmount, 0);
  const activeCount = groups.filter((g) => !g.isFullyPaid).length;
  const completedCount = groups.filter((g) => g.isFullyPaid).length;

  const percentPaid =
    totalOriginalAmount > 0 ? (totalPaidDebt / totalOriginalAmount) * 100 : 0;

  return (
    <div id="installments-page" className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3 border border-indigo-200/60">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Página de Cartão de Crédito</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Cartões & Compras Parceladas
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Tenha controle absoluto de cada compra feita no cartão: acompanhe o número de parcelas restantes, o valor da fatura futura e a quitação progressiva.
          </p>
        </div>

        <button
          id="btn-page-new-installment"
          type="button"
          onClick={onOpenNewInstallment}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Compra Parcelada</span>
        </button>
      </div>

      {/* 3 Executive Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Saldo Devedor Restante
          </span>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {formatCurrency(totalCardDebt)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total somado de todas as parcelas futuras
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Já Quitado
          </span>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight mt-2">
            {formatCurrency(totalPaidDebt)}
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${percentPaid}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {percentPaid.toFixed(0)}% do valor total já foi pago
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Compras Ativas
          </span>
          <div className="text-2xl font-bold text-indigo-600 tracking-tight mt-2">
            {activeCount} {activeCount === 1 ? 'compra' : 'compras'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {completedCount} compra(s) já 100% quitada(s)
          </p>
        </div>
      </div>

      {/* Due Alerts for Installments */}
      {dueAlerts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Parcelas com Vencimento Próximo</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {dueAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white p-3 rounded-xl border border-amber-200/70 text-xs flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{alert.title}</div>
                  <div className="text-[11px] text-slate-500">
                    Vencimento: {formatDateBR(alert.dueDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatCurrency(alert.amount)}</div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      alert.urgency === 'overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : alert.urgency === 'today'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {alert.diffDays < 0
                      ? `Atrasado ${Math.abs(alert.diffDays)}d`
                      : alert.diffDays === 0
                      ? 'Vence hoje'
                      : `Em ${alert.diffDays} dias`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Installments Component */}
      <CreditCardInstallmentsCard
        groups={groups}
        onOpenNewInstallment={onOpenNewInstallment}
        onToggleStatus={onToggleStatus}
        onDeleteGroup={onDeleteGroup}
      />
    </div>
  );
};
