import { Transaction, InstallmentGroup, DueAlert, PaymentMethod } from '../types.ts';

/**
 * Calcula a data exata da parcela com tratamento de meses com 28, 30 ou 31 dias
 */
export function getInstallmentDate(startYear: number, startMonthIndex: number, dayOfMonth: number, installmentIndex: number): string {
  // startMonthIndex: 0 = Janeiro, 8 = Setembro
  const totalMonths = startMonthIndex + installmentIndex;
  const targetYear = startYear + Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1; // 1 a 12

  // Limita o dia ao último dia válido do mês alvo (ex: 31 de fev vira 28 de fev)
  const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const safeDay = Math.min(dayOfMonth, daysInTargetMonth);

  const mm = String(targetMonth).padStart(2, '0');
  const dd = String(safeDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
}

export interface GenerateInstallmentsParams {
  description: string;
  totalAmount: number;
  installmentsCount: number;
  category: string;
  dueDay: number;
  startMonth: string; // YYYY-MM
  cardName?: string;
  firstInstallmentPaid?: boolean;
  notes?: string;
  customGroupId?: string;
}

/**
 * Cria a lista de transações para uma compra parcelada no cartão
 */
export function generateInstallmentTransactions(params: GenerateInstallmentsParams): Omit<Transaction, 'id'>[] {
  const {
    description,
    totalAmount,
    installmentsCount,
    category,
    dueDay,
    startMonth,
    cardName = 'Cartão de Crédito',
    firstInstallmentPaid = false,
    notes = '',
    customGroupId,
  } = params;

  const count = Math.max(1, Math.min(60, installmentsCount));
  const groupId = customGroupId || `group-card-${Date.now()}`;

  // Cálculo do valor de cada parcela com arredondamento seguro em centavos
  const baseInstallment = Math.floor((totalAmount / count) * 100) / 100;
  const remainder = Math.round((totalAmount - baseInstallment * count) * 100) / 100;

  const [yearStr, monthStr] = startMonth.split('-');
  const startYear = parseInt(yearStr, 10) || 2026;
  const startMonthIndex = (parseInt(monthStr, 10) || 9) - 1;

  const transactions: Omit<Transaction, 'id'>[] = [];

  for (let i = 0; i < count; i++) {
    const installmentNumber = i + 1;
    // O centavo residual é colocado na primeira parcela
    const amount = i === 0 ? Number((baseInstallment + remainder).toFixed(2)) : baseInstallment;
    const installmentDate = getInstallmentDate(startYear, startMonthIndex, dueDay, i);

    const isFirstAndPaid = i === 0 && firstInstallmentPaid;
    const status = isFirstAndPaid ? 'completed' : 'pending';

    const cardNote = cardName ? ` • ${cardName}` : '';
    const fullNotes = notes
      ? `${notes}${cardNote}`
      : `Parcela ${installmentNumber}/${count} da compra "${description}"${cardNote}`;

    transactions.push({
      description: `${description} (${installmentNumber}/${count})`,
      amount,
      type: 'expense',
      category: category || 'Vestuário & Compras',
      date: installmentDate,
      paymentMethod: 'credit_card',
      status,
      notes: fullNotes,
      installment: {
        current: installmentNumber,
        total: count,
        groupId,
        totalAmount,
        cardName,
      },
    });
  }

  return transactions;
}

/**
 * Agrupa transações de compras parceladas para visualização do progresso geral
 */
export function groupInstallmentPurchases(transactions: Transaction[]): InstallmentGroup[] {
  const groupsMap = new Map<string, Transaction[]>();

  // Agrupa transações que possuem installment.groupId
  transactions.forEach((tx) => {
    if (tx.installment?.groupId) {
      const gId = tx.installment.groupId;
      if (!groupsMap.has(gId)) {
        groupsMap.set(gId, []);
      }
      groupsMap.get(gId)!.push(tx);
    }
  });

  const result: InstallmentGroup[] = [];

  groupsMap.forEach((txs, groupId) => {
    // Ordena por número da parcela
    txs.sort((a, b) => (a.installment?.current || 0) - (b.installment?.current || 0));

    const firstTx = txs[0];
    const totalInstallments = firstTx.installment?.total || txs.length;
    const rawTotalAmount = firstTx.installment?.totalAmount || txs.reduce((acc, t) => acc + t.amount, 0);

    // Extrai o título limpo removendo (X/Y)
    const title = firstTx.description.replace(/\s*\(\d+\/\d+\)$/, '').trim();
    const cardName = firstTx.installment?.cardName || 'Cartão de Crédito';
    const category = firstTx.category;

    const paidTxs = txs.filter((t) => t.status === 'completed');
    const pendingTxs = txs.filter((t) => t.status === 'pending');

    const paidInstallments = paidTxs.length;
    const remainingInstallments = pendingTxs.length;
    const paidAmount = paidTxs.reduce((sum, t) => sum + t.amount, 0);
    const remainingAmount = pendingTxs.reduce((sum, t) => sum + t.amount, 0);

    // Próxima parcela a vencer
    let nextDueDate: string | null = null;
    let nextDueAmount: number | null = null;
    let nextDueInstallmentNumber: number | null = null;

    if (pendingTxs.length > 0) {
      // Ordena as pendentes pela data mais próxima
      const sortedPending = [...pendingTxs].sort((a, b) => a.date.localeCompare(b.date));
      nextDueDate = sortedPending[0].date;
      nextDueAmount = sortedPending[0].amount;
      nextDueInstallmentNumber = sortedPending[0].installment?.current || null;
    }

    result.push({
      groupId,
      title,
      cardName,
      category,
      totalAmount: rawTotalAmount,
      installmentAmount: firstTx.amount,
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      paidAmount,
      remainingAmount,
      nextDueDate,
      nextDueAmount,
      nextDueInstallmentNumber,
      isFullyPaid: remainingInstallments === 0,
      transactions: txs,
    });
  });

  // Ordena compras: primeiro as que têm parcelas pendentes com vencimento mais próximo
  result.sort((a, b) => {
    if (a.isFullyPaid && !b.isFullyPaid) return 1;
    if (!a.isFullyPaid && b.isFullyPaid) return -1;
    if (a.nextDueDate && b.nextDueDate) return a.nextDueDate.localeCompare(b.nextDueDate);
    return a.title.localeCompare(b.title);
  });

  return result;
}

/**
 * Calcula alertas de vencimento para parcelas e contas pendentes
 */
export function calculateDueAlerts(
  transactions: Transaction[],
  referenceDateStr?: string,
  maxDaysAhead: number = 7
): DueAlert[] {
  // Data de referência (hoje)
  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];
  const [refY, refM, refD] = todayStr.split('-').map((v) => parseInt(v, 10));
  const refDateObj = new Date(refY, refM - 1, refD);

  const alerts: DueAlert[] = [];

  transactions.forEach((tx) => {
    // Apenas despesas pendentes geram alerta de vencimento
    if (tx.status !== 'pending' || tx.type !== 'expense') {
      return;
    }

    const [txY, txM, txD] = tx.date.split('-').map((v) => parseInt(v, 10));
    const txDateObj = new Date(txY, txM - 1, txD);

    const diffTime = txDateObj.getTime() - refDateObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Considera alertas de vencidas (até 30 dias atrás) até o limite configurado à frente
    if (diffDays <= maxDaysAhead && diffDays >= -30) {
      let urgency: 'overdue' | 'today' | 'upcoming' = 'upcoming';
      if (diffDays < 0) {
        urgency = 'overdue';
      } else if (diffDays === 0) {
        urgency = 'today';
      }

      const isInstallment = !!tx.installment;
      const installmentLabel = tx.installment
        ? `Parcela ${tx.installment.current} de ${tx.installment.total}`
        : undefined;

      alerts.push({
        id: `alert-${tx.id}`,
        transactionId: tx.id,
        title: tx.description,
        amount: tx.amount,
        dueDate: tx.date,
        diffDays,
        urgency,
        isInstallment,
        installmentLabel,
        paymentMethod: tx.paymentMethod,
      });
    }
  });

  // Ordena alertas: vencidas primeiro, depois hoje, depois por dias restantes
  alerts.sort((a, b) => {
    const urgencyOrder = { overdue: 0, today: 1, upcoming: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.diffDays - b.diffDays;
  });

  return alerts;
}
