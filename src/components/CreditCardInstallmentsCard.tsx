import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  Calendar,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { InstallmentGroup, Transaction } from '../types.ts';
import { formatCurrency, formatDateBR } from '../utils/formatters.ts';

interface CreditCardInstallmentsCardProps {
  groups: InstallmentGroup[];
  onOpenNewInstallment: () => void;
  onToggleStatus: (transactionId: string) => void;
  onDeleteGroup: (groupId: string, title: string) => void;
}

export const CreditCardInstallmentsCard: React.FC<CreditCardInstallmentsCardProps> = ({
  groups,
  onOpenNewInstallment,
  onToggleStatus,
  onDeleteGroup,
}) => {
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const toggleExpand = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const totalCardDebt = groups.reduce((acc, g) => acc + g.remainingAmount, 0);
  const totalPaidDebt = groups.reduce((acc, g) => acc + g.paidAmount, 0);
  const activeCount = groups.filter((g) => !g.isFullyPaid).length;

  return (
    <div
      id="card-installments-section"
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs"
    >
      {/* Header do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Compras Parceladas no Cartão de Crédito
              </h3>
              {activeCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeCount} {activeCount === 1 ? 'compra ativa' : 'compras ativas'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe cada parcela paga, o saldo devedor restante e os próximos vencimentos
            </p>
          </div>
        </div>

        <button
          id="btn-new-installment-purchase"
          type="button"
          onClick={onOpenNewInstallment}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Parcelar Nova Compra</span>
        </button>
      </div>

      {/* Resumo Consolidado de Parcelas */}
      {groups.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Parcelado Ativo
            </span>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(totalCardDebt + totalPaidDebt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Total Já Pago
            </span>
            <p className="text-base font-extrabold text-emerald-600 mt-0.5">
              {formatCurrency(totalPaidDebt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Restante a Pagar
            </span>
            <p className="text-base font-extrabold text-indigo-600 mt-0.5">
              {formatCurrency(totalCardDebt)}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Compras Parceladas */}
      <div className="mt-4 space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">
              Nenhuma compra parcelada cadastrada ainda
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Comprou um tênis, celular ou eletrônico parcelado no cartão? Cadastre a compra aqui
              para o aplicativo gerar todas as parcelas mês a mês e avisar quando estiver perto do vencimento.
            </p>
            <button
              type="button"
              onClick={onOpenNewInstallment}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Compra Parcelada (Ex: Tênis em 6x)</span>
            </button>
          </div>
        ) : (
          groups.map((group) => {
            const isExpanded = expandedGroupId === group.groupId;
            const progressPercent = Math.round(
              (group.paidInstallments / group.totalInstallments) * 100
            );

            // Encontra a próxima transação pendente para permitir pagamento rápido
            const nextPendingTx = group.transactions.find((t) => t.status === 'pending');

            return (
              <div
                key={group.groupId}
                className="rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50/80 transition-all overflow-hidden"
              >
                {/* Linha Principal da Compra */}
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-2xs">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {group.title}
                          </h4>
                          {group.isFullyPaid ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Quitada! (100% Paga)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {group.paidInstallments} de {group.totalInstallments} pagas ({progressPercent}%)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span>{group.cardName}</span>
                          <span>•</span>
                          <span>{group.category}</span>
                          <span>•</span>
                          <span>{group.totalInstallments}x de {formatCurrency(group.installmentAmount)}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">Total: {formatCurrency(group.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Próximo Vencimento & Ações */}
                    <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                      {!group.isFullyPaid && nextPendingTx && (
                        <div className="text-left md:text-right mr-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Próxima Parcela ({group.nextDueInstallmentNumber}/{group.totalInstallments})
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {formatDateBR(nextPendingTx.date)} • {formatCurrency(nextPendingTx.amount)}
                          </span>
                        </div>
                      )}

                      {!group.isFullyPaid && nextPendingTx && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(nextPendingTx.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                          title={`Marcar parcela ${group.nextDueInstallmentNumber}/${group.totalInstallments} como paga`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pagar Parcela {group.nextDueInstallmentNumber}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpand(group.groupId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                        title={isExpanded ? 'Ocultar detalhes' : 'Ver todas as parcelas'}
                      >
                        <span>{isExpanded ? 'Ocultar' : 'Ver Parcelas'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteGroup(group.groupId, group.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir todas as parcelas desta compra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Barra de Progresso Visual das Parcelas */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>
                        Progresso: <strong>{group.paidInstallments}</strong> de <strong>{group.totalInstallments}</strong> parcelas pagas
                      </span>
                      <span>
                        Pago: <strong className="text-emerald-600">{formatCurrency(group.paidAmount)}</strong> • Restante:{' '}
                        <strong className="text-indigo-600">{formatCurrency(group.remainingAmount)}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          group.isFullyPaid ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Detalhe Expandido de Todas as Parcelas */}
                {isExpanded && (
                  <div className="border-t border-slate-200/80 bg-white p-4">
                    <h5 className="text-xs font-bold text-slate-700 mb-2.5">
                      Detalhamento Mês a Mês das {group.totalInstallments} Parcelas:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {group.transactions.map((tx) => {
                        const isPaid = tx.status === 'completed';
                        const installmentNum = tx.installment?.current || 1;

                        return (
                          <div
                            key={tx.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                              isPaid
                                ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950'
                                : 'bg-slate-50/80 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold">
                                  Parcela {installmentNum}/{group.totalInstallments}
                                </span>
                                {isPaid ? (
                                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                                    Paga
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                                    Pendente
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Vencimento: <strong>{formatDateBR(tx.date)}</strong>
                              </p>
                              <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                                {formatCurrency(tx.amount)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => onToggleStatus(tx.id)}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                isPaid
                                  ? 'text-emerald-700 hover:bg-emerald-100'
                                  : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={isPaid ? 'Marcar como pendente' : 'Marcar como paga'}
                            >
                              <CheckCircle2
                                className={`w-5 h-5 ${isPaid ? 'text-emerald-600 fill-emerald-100' : 'text-slate-300'}`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
