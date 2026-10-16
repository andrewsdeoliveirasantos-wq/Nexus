export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'bank_slip' | 'cash';

export type TransactionStatus = 'completed' | 'pending';

export type CoupleMember = 'andrews' | 'rayssa' | 'both';

export interface InstallmentDetails {
  current: number; // Ex: 1 (de 6)
  total: number; // Ex: 6
  groupId: string; // ID único para agrupar as parcelas da mesma compra
  totalAmount: number; // Valor total da compra original
  cardName?: string; // Ex: "Cartão Nubank", "Visa", etc.
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  notes?: string;
  installment?: InstallmentDetails;
  member?: CoupleMember; // Andrews, Rayssa ou Casal (Ambos)
}

export interface InstallmentGroup {
  groupId: string;
  title: string;
  cardName: string;
  category: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  paidAmount: number;
  remainingAmount: number;
  nextDueDate: string | null;
  nextDueAmount: number | null;
  nextDueInstallmentNumber: number | null;
  isFullyPaid: boolean;
  transactions: Transaction[];
}

export interface DueAlert {
  id: string;
  transactionId: string;
  title: string;
  amount: number;
  dueDate: string;
  diffDays: number; // < 0: em atraso, 0: vence hoje, > 0: faltam X dias
  urgency: 'overdue' | 'today' | 'upcoming';
  isInstallment: boolean;
  installmentLabel?: string; // Ex: "Parcela 2 de 6"
  paymentMethod: PaymentMethod;
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  type: TransactionType;
}

export interface MonthlyStats {
  monthKey: string; // YYYY-MM
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  pendingExpense: number;
  pendingIncome: number;
  // Couple breakdown
  andrewsIncome: number;
  rayssaIncome: number;
  andrewsExpense: number;
  rayssaExpense: number;
  bothExpense: number;
  dailyExpenses: { date: string; day: string; amount: number }[];
  categoryExpenses: { name: string; amount: number; percentage: number; color: string }[];
  categoryIncomes: { name: string; amount: number; percentage: number; color: string }[];
  paymentMethodDistribution: { method: string; label: string; amount: number; percentage: number }[];
  topExpenses: Transaction[];
  dailyAverageExpense: number;
  highestExpenseDay: { date: string; amount: number } | null;
  comparisonWithPrevious: {
    incomeChangePercent: number;
    expenseChangePercent: number;
    savingsChangePercent: number;
  };
}

export type ViewTab =
  | 'home'
  | 'agenda'
  | 'transactions'
  | 'installments'
  | 'reports'
  | 'dashboard'
  | 'monthly_report';

export type CommitmentType = 'emergency' | 'appointment' | 'task';

export type CommitmentPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface DailyCommitment {
  id: string;
  title: string;
  type: CommitmentType; // 'emergency' (Socorro), 'appointment' (Compromisso c/ hora), 'task' (Tarefa)
  priority: CommitmentPriority;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  completed: boolean;
  completedAt?: string;
  notes?: string;
  soundAlertMinutesBefore?: number; // 0 = na hora, 5, 10, 15, 30 min antes
  soundEnabled?: boolean;
  location?: string;
  createdAt: string;
  lastAlertedTimestamp?: number;
  member?: CoupleMember; // Andrews, Rayssa ou Casal
}

export type GoalTimeframe = 'weekly' | 'monthly' | 'yearly';

export interface GoalItem {
  id: string;
  title: string;
  timeframe: GoalTimeframe; // 'weekly' (Semanal), 'monthly' (Mensal), 'yearly' (Anual)
  category?: string;
  targetMonth?: string; // YYYY-MM
  targetYear?: number;
  targetDate?: string; // YYYY-MM-DD
  targetAmount?: number; // Valor financeiro estimado (opcional)
  savedAmount?: number; // Valor já acumulado/pago (opcional)
  completed: boolean;
  completedAt?: string;
  member?: CoupleMember; // Andrews, Rayssa ou Casal
  priority?: CommitmentPriority;
  notes?: string;
  createdAt: string;
}

