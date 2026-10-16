import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Bell, ChevronRight, X, CreditCard, ShieldAlert } from 'lucide-react';
import { DueAlert } from '../types.ts';
import { formatCurrency, formatDateBR } from '../utils/formatters.ts';

interface DueAlertsBannerProps {
  alerts: DueAlert[];
  onMarkAsPaid: (transactionId: string) => void;
  onOpenNewInstallment?: () => void;
}

export const DueAlertsBanner: React.FC<DueAlertsBannerProps> = ({
  alerts,
  onMarkAsPaid,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [daysFilter, setDaysFilter] = useState<number>(7);

  if (isDismissed || alerts.length === 0) {
    return null;
  }

  const overdueCount = alerts.filter((a) => a.urgency === 'overdue').length;
  const todayCount = alerts.filter((a) => a.urgency === 'today').length;
  const upcomingCount = alerts.filter((a) => a.urgency === 'upcoming').length;

  return (
    <div
      id="due-alerts-banner"
      className="mb-6 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/95 via-amber-50/80 to-orange-50/90 p-4 sm:p-5 shadow-xs transition-all"
    >
      {/* Header do Alerta */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <span>Alertas de Vencimento de Parcelas & Contas</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900">
                {alerts.length} {alerts.length === 1 ? 'pendência' : 'pendências'}
              </span>
            </h3>
            <p className="text-xs text-amber-800/90">
              Avisos preventivos para você acompanhar o que está vencendo no cartão e não esquecer de pagar
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-amber-700 hover:text-amber-900 p-1.5 rounded-lg hover:bg-amber-100/70 transition-colors"
          title="Ocultar avisos temporariamente"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de Alertas Ativos */}
      <div className="mt-3.5 space-y-2.5">
        {alerts.slice(0, 4).map((alert) => {
          let badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
          let badgeText = `Vence em ${alert.diffDays} dias`;
          let icon = <Clock className="w-3.5 h-3.5 text-amber-600" />;

          if (alert.urgency === 'overdue') {
            badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';
            const daysAgo = Math.abs(alert.diffDays);
            badgeText = daysAgo === 1 ? 'Venceu ontem' : `Vencida há ${daysAgo} dias`;
            icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
          } else if (alert.urgency === 'today') {
            badgeBg = 'bg-amber-500 text-white border-amber-600 font-bold animate-pulse';
            badgeText = 'VENCE HOJE!';
            icon = <AlertTriangle className="w-3.5 h-3.5 text-white" />;
          }

          return (
            <div
              key={alert.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/90 border border-amber-200/70 shadow-2xs hover:bg-white transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  {alert.isInstallment ? (
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {alert.title}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeBg}`}
                    >
                      {icon}
                      <span>{badgeText}</span>
                    </span>
                    {alert.installmentLabel && (
                      <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                        {alert.installmentLabel}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vencimento previsto para <strong>{formatDateBR(alert.dueDate)}</strong> • Valor:{' '}
                    <strong className="text-slate-900 font-bold">{formatCurrency(alert.amount)}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => onMarkAsPaid(alert.transactionId)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all cursor-pointer"
                  title="Marcar esta parcela ou conta como paga"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar como Paga</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length > 4 && (
        <p className="text-[11px] text-amber-800 text-center mt-3 font-medium">
          + {alerts.length - 4} outras despesas ou parcelas próximas do vencimento
        </p>
      )}
    </div>
  );
};
