import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, ViewTab, DailyCommitment, CommitmentType, CoupleMember, GoalItem } from './types.ts';
import { INITIAL_TRANSACTIONS, DEMO_TRANSACTIONS } from './data/initialData.ts';
import { getDefaultCommitments, getDemoCommitments } from './data/defaultCommitments.ts';
import {
  calculateMonthlyStats,
  calculateHistoricalTrend,
  getAvailableMonths,
} from './utils/analytics.ts';
import { Header } from './components/Header.tsx';
import { HomePage } from './components/HomePage.tsx';
import { FinancesPage } from './components/FinancesPage.tsx';
import { InstallmentsPage } from './components/InstallmentsPage.tsx';
import { ReportsAnalyticsPage } from './components/ReportsAnalyticsPage.tsx';
import { AgendaView } from './components/AgendaView.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';
import { QuickSetupModal } from './components/QuickSetupModal.tsx';
import { CommitmentModal } from './components/CommitmentModal.tsx';
import { CoupleSalaryModal } from './components/CoupleSalaryModal.tsx';
import { CoupleSelector } from './components/CoupleSelector.tsx';
import { ActiveAlertNotification } from './components/ActiveAlertNotification.tsx';
import { useCommitmentMonitor } from './hooks/useCommitmentMonitor.ts';
import {
  subscribeTransactions,
  subscribeCommitments,
  subscribeGoals,
  syncSaveTransaction,
  syncSaveMultipleTransactions,
  syncDeleteTransaction,
  syncSaveCommitment,
  syncDeleteCommitment,
  syncSaveGoal,
  syncDeleteGoal,
  syncClearAllTransactions,
  syncClearAllCommitments,
  syncClearAllGoals,
} from './firebase/firestoreService.ts';
import { Check, Info, AlertTriangle, Sparkles, Trash2, X, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'financas_pessoais_txs_v4_zero';
const COMMITMENTS_STORAGE_KEY = 'financas_daily_commitments_v2_zero';
const GOALS_STORAGE_KEY = 'financas_couple_goals_v2';
const DEVICE_PROFILE_KEY = 'financas_device_profile_v1';

const DEFAULT_INITIAL_GOALS: GoalItem[] = [
  {
    id: 'goal-demo-1',
    title: 'Arrumar o carro (troca de óleo e alinhamento)',
    timeframe: 'weekly',
    category: 'Veículo & Transporte',
    targetAmount: 350,
    savedAmount: 350,
    completed: false,
    member: 'andrews',
    priority: 'high',
    notes: 'Levar na oficina sábado de manhã',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'goal-demo-2',
    title: 'Comprar um tênis novo',
    timeframe: 'monthly',
    category: 'Pessoal, Vestuário & Compras',
    targetAmount: 390,
    savedAmount: 200,
    completed: false,
    member: 'andrews',
    priority: 'normal',
    notes: 'Pesquisar promoção online com frete grátis',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'goal-demo-3',
    title: 'Construir o muro da casa',
    timeframe: 'yearly',
    category: 'Casa, Reforma & Obra',
    targetAmount: 4500,
    savedAmount: 1500,
    completed: false,
    member: 'both',
    priority: 'high',
    notes: 'Cotação de blocos, cimento e contratação do pedreiro',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  // Device identity profile: Andrews or Rayssa (persisted per device)
  const [currentProfile, setCurrentProfile] = useState<CoupleMember>(() => {
    try {
      const saved = localStorage.getItem(DEVICE_PROFILE_KEY);
      if (saved === 'andrews' || saved === 'rayssa') {
        return saved;
      }
    } catch (e) {
      console.warn(e);
    }
    return 'andrews';
  });

  const [selectedMemberFilter, setSelectedMemberFilter] = useState<'all' | 'andrews' | 'rayssa'>('all');
  const [isCoupleSalaryModalOpen, setIsCoupleSalaryModalOpen] = useState(false);

  // Load transactions from localStorage or initialize with clean zero array []
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      localStorage.removeItem('financas_pessoais_txs_v1');
      localStorage.removeItem('financas_pessoais_txs_v2');

      const savedClean = localStorage.getItem(STORAGE_KEY);
      if (savedClean) {
        const parsed = JSON.parse(savedClean);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar do localStorage:', err);
    }
    return INITIAL_TRANSACTIONS; // empty []
  });

  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState<'single' | 'split_salary' | 'installments'>('single');
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dismissedDemoAlert, setDismissedDemoAlert] = useState(false);

  // Goals & Objectives State (Semanal, Mensal, Anual)
  const [goals, setGoals] = useState<GoalItem[]>(() => {
    try {
      const saved = localStorage.getItem(GOALS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar objetivos:', err);
    }
    return DEFAULT_INITIAL_GOALS;
  });

  // Sync goals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (err) {
      console.warn('Erro ao salvar objetivos no localStorage:', err);
    }
  }, [goals]);

  // Real-time synchronization with Firebase Firestore (multi-device)
  useEffect(() => {
    let isMounted = true;
    let hasInitializedGoalsRef = false;

    const unsubTx = subscribeTransactions(
      (remoteTxs) => {
        if (!isMounted) return;
        // Merge or replace from real-time Firestore
        setTransactions(remoteTxs);
      },
      (err) => console.warn('Firestore transactions sync:', err)
    );

    const unsubComm = subscribeCommitments(
      (remoteComms) => {
        if (!isMounted) return;
        setCommitments(remoteComms);
      },
      (err) => console.warn('Firestore commitments sync:', err)
    );

    const unsubGoals = subscribeGoals(
      async (remoteGoals) => {
        if (!isMounted) return;

        // If this is the initial snapshot and Firestore is empty:
        if (!hasInitializedGoalsRef && remoteGoals.length === 0) {
          hasInitializedGoalsRef = true;
          const localSaved = localStorage.getItem(GOALS_STORAGE_KEY);
          if (localSaved !== null) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed)) {
                setGoals(parsed);
                // Also upload to Firestore so both devices are in sync
                for (const g of parsed) {
                  await syncSaveGoal(g);
                }
                return;
              }
            } catch (e) {
              console.warn(e);
            }
          }
          // Seed defaults to Firestore if first time ever
          setGoals(DEFAULT_INITIAL_GOALS);
          for (const g of DEFAULT_INITIAL_GOALS) {
            await syncSaveGoal(g);
          }
          return;
        }

        hasInitializedGoalsRef = true;
        setGoals(remoteGoals);
      },
      (err) => console.warn('Firestore goals sync:', err)
    );

    return () => {
      isMounted = false;
      unsubTx();
      unsubComm();
      unsubGoals();
    };
  }, []);

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Commitments & Daily Emergencies State (starts empty [])
  const [commitments, setCommitments] = useState<DailyCommitment[]>(() => {
    try {
      localStorage.removeItem('financas_daily_commitments_v1');
      const saved = localStorage.getItem(COMMITMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar compromissos do localStorage:', err);
    }
    return getDefaultCommitments(); // empty []
  });

  const [selectedAgendaDate, setSelectedAgendaDate] = useState<string>(getTodayStr);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [commitmentToEdit, setCommitmentToEdit] = useState<DailyCommitment | null>(null);
  const [commitmentModalType, setCommitmentModalType] = useState<CommitmentType>('emergency');

  // Sync commitments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COMMITMENTS_STORAGE_KEY, JSON.stringify(commitments));
    } catch (err) {
      console.warn('Erro ao salvar compromissos no localStorage:', err);
    }
  }, [commitments]);

  const handleUpdateCommitment = useCallback((updated: DailyCommitment) => {
    setCommitments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  // Background monitor that fires Web Audio chimes / sound beeps when commitments are approaching
  const { activeAlert, dismissAlert, snooze5Min } = useCommitmentMonitor(
    commitments,
    handleUpdateCommitment
  );

  // Sync transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (err) {
      console.warn('Erro ao salvar no localStorage:', err);
    }
  }, [transactions]);

  // Helper to identify demo / seed transactions
  const isSeedTransaction = (t: Transaction): boolean => {
    return (
      t.id.startsWith('tx-sep-') ||
      t.id.startsWith('tx-aug-') ||
      t.id.startsWith('tx-jul-') ||
      t.id.startsWith('tx-jun-') ||
      t.id.startsWith('tx-may-') ||
      t.id.startsWith('tx-apr-') ||
      t.description.includes('Aluguel do Apartamento') ||
      t.description.includes('Supermercado Mensal') ||
      t.description.includes('Empresa Tech')
    );
  };

  const hasDemoTransactions = useMemo(() => {
    return transactions.some(isSeedTransaction);
  }, [transactions]);

  // User-created transactions (not from seed data)
  const userCreatedTransactions = useMemo(() => {
    return transactions.filter((t) => !isSeedTransaction(t));
  }, [transactions]);

  // Toast notification helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Available months list
  const availableMonths = useMemo(() => {
    return getAvailableMonths(transactions);
  }, [transactions]);

  // Ensure selectedMonth is valid
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Calculated stats for selected month
  const currentMonthStats = useMemo(() => {
    return calculateMonthlyStats(transactions, selectedMonth);
  }, [transactions, selectedMonth]);

  // 6-month historical trend
  const historicalTrend = useMemo(() => {
    return calculateHistoricalTrend(transactions, 6);
  }, [transactions]);

  // All-time balance
  const totalBalance = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    });
    return income - expense;
  }, [transactions]);

  // Handlers
  const handleOpenNewTransaction = () => {
    setTransactionToEdit(null);
    setModalInitialMode('single');
    setIsModalOpen(true);
  };

  const handleOpenSplitSalaryModal = () => {
    setTransactionToEdit(null);
    setModalInitialMode('split_salary');
    setIsModalOpen(true);
  };

  const handleOpenNewInstallment = () => {
    setTransactionToEdit(null);
    setModalInitialMode('installments');
    setIsModalOpen(true);
  };

  const handleDeleteInstallmentGroup = (groupId: string, title: string) => {
    if (window.confirm(`Deseja realmente excluir todas as parcelas da compra "${title}"?`)) {
      setTransactions((prev) => prev.filter((t) => t.installment?.groupId !== groupId));
      showToast(`Todas as parcelas de "${title}" foram excluídas.`);
    }
  };

  const handleProfileChange = (profile: CoupleMember) => {
    setCurrentProfile(profile);
    try {
      localStorage.setItem(DEVICE_PROFILE_KEY, profile);
    } catch (e) {
      console.warn(e);
    }
    showToast(`Celular configurado para: ${profile === 'rayssa' ? 'Rayssa 👩‍💼' : 'Andrews 👨‍💼'}`);
  };

  // Commitment and Daily Emergencies Handlers
  const handleSaveCommitment = (comm: DailyCommitment) => {
    const toSave: DailyCommitment = {
      ...comm,
      member: comm.member || currentProfile,
    };
    setCommitments((prev) => {
      const exists = prev.some((c) => c.id === toSave.id);
      if (exists) {
        return prev.map((c) => (c.id === toSave.id ? toSave : c));
      }
      return [toSave, ...prev];
    });
    syncSaveCommitment(toSave).catch(console.error);
    showToast(
      toSave.type === 'emergency'
        ? '🚨 Socorro do dia registrado com sucesso!'
        : '📅 Compromisso agendado com sucesso!'
    );
  };

  const handleToggleCommitment = (id: string) => {
    setCommitments((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextVal = !c.completed;
          const updated = {
            ...c,
            completed: nextVal,
            completedAt: nextVal ? new Date().toISOString() : undefined,
          };
          syncSaveCommitment(updated).catch(console.error);
          return updated;
        }
        return c;
      })
    );
  };

  const handleDeleteCommitment = (id: string) => {
    setCommitments((prev) => prev.filter((c) => c.id !== id));
    syncDeleteCommitment(id).catch(console.error);
    showToast('Item removido da agenda.');
  };

  // Goals & Objectives Handlers (Semanais, Mensais e Anuais)
  const handleSaveGoal = (goal: GoalItem) => {
    const toSave: GoalItem = {
      ...goal,
      member: goal.member || currentProfile,
    };
    setGoals((prev) => {
      const exists = prev.some((g) => g.id === toSave.id);
      if (exists) {
        return prev.map((g) => (g.id === toSave.id ? toSave : g));
      }
      return [toSave, ...prev];
    });
    syncSaveGoal(toSave).catch(console.error);
    showToast(`🎯 Objetivo "${toSave.title}" salvo com sucesso!`);
  };

  const handleToggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextVal = !g.completed;
          const updated = {
            ...g,
            completed: nextVal,
            completedAt: nextVal ? new Date().toISOString() : undefined,
          };
          syncSaveGoal(updated).catch(console.error);
          return updated;
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      try {
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
    syncDeleteGoal(id).catch(console.error);
    showToast('🗑️ Meta excluída com sucesso.');
  };

  const handleAddSavingsTransaction = (desc: string, amount: number, category: string) => {
    const timestamp = Date.now();
    const todayStr = getTodayStr();
    const txDate = selectedMonth ? `${selectedMonth}-10` : todayStr;
    const newTx: Transaction = {
      id: `tx-saving-${timestamp}`,
      description: desc,
      amount,
      type: 'expense',
      category: category || 'Investimentos & Poupança',
      date: txDate,
      paymentMethod: 'pix',
      status: 'completed',
      member: currentProfile,
      notes: 'Aporte de dinheiro guardado para meta/reserva',
    };
    setTransactions((prev) => [newTx, ...prev]);
    syncSaveMultipleTransactions([newTx]).catch(console.error);
    showToast(`💰 Aporte de R$ ${amount.toFixed(2).replace('.', ',')} registrado no extrato do mês!`);
  };

  const handleClearCompletedCommitments = () => {
    const count = commitments.filter((c) => c.completed && c.date === selectedAgendaDate).length;
    if (count === 0) return;
    const toDelete = commitments.filter((c) => c.completed && c.date === selectedAgendaDate);
    setCommitments((prev) => prev.filter((c) => !(c.completed && c.date === selectedAgendaDate)));
    toDelete.forEach((c) => syncDeleteCommitment(c.id).catch(console.error));
    showToast(`${count} item(ns) concluído(s) removido(s) do dia.`);
  };

  const handleRestoreDefaultCommitments = () => {
    const demo = getDemoCommitments();
    setCommitments(demo);
    showToast('Exemplos de socorros e compromissos carregados na agenda.');
  };

  const handleOpenNewCommitmentModal = (
    type: CommitmentType = 'emergency',
    date?: string
  ) => {
    setCommitmentToEdit(null);
    setCommitmentModalType(type);
    if (date) setSelectedAgendaDate(date);
    setIsCommitmentModalOpen(true);
  };

  const handleEditCommitmentModal = (comm: DailyCommitment) => {
    setCommitmentToEdit(comm);
    setCommitmentModalType(comm.type);
    setIsCommitmentModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setModalInitialMode('single');
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id'>,
    editId?: string
  ) => {
    if (editId) {
      const updatedTx: Transaction = { ...txData, id: editId };
      setTransactions((prev) =>
        prev.map((t) => (t.id === editId ? updatedTx : t))
      );
      syncSaveTransaction(updatedTx).catch(console.error);
      showToast('Transação atualizada com sucesso!');
    } else {
      const newTx: Transaction = {
        ...txData,
        member: txData.member || currentProfile,
        id: `tx-${Date.now()}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      syncSaveTransaction(newTx).catch(console.error);
      showToast('Nova transação adicionada e sincronizada!');
    }
  };

  const handleSaveMultipleTransactions = (
    txList: Omit<Transaction, 'id'>[],
    replaceMonth?: string
  ) => {
    const timestamp = Date.now();
    const newTxs: Transaction[] = txList.map((tx, idx) => ({
      ...tx,
      member: tx.member || currentProfile,
      id: `tx-${timestamp}-${idx}`,
    }));

    setTransactions((prev) => {
      let base = prev;
      if (replaceMonth) {
        // Remove existing salary incomes in that month to avoid double counting
        base = prev.filter(
          (t) =>
            !(
              t.date.startsWith(replaceMonth) &&
              t.type === 'income' &&
              (t.category.toLowerCase().includes('salário') ||
                t.category.toLowerCase().includes('salario') ||
                t.category.toLowerCase().includes('vale') ||
                t.description.toLowerCase().includes('salário') ||
                t.description.toLowerCase().includes('adiantamento'))
            )
        );
      }
      return [...newTxs, ...base];
    });
    syncSaveMultipleTransactions(newTxs).catch(console.error);
    showToast('Salário dividido lançado com sucesso (duas parcelas criadas)!');
  };

  // Configuração dos salários e entradas diversas do casal (Andrews & Rayssa)
  const handleSaveCoupleSalaries = (
    andrews5: number,
    andrewsAdv: number,
    rayssa5: number,
    rayssaAdv: number,
    targetMonth: string,
    andrewsExtra?: { amount: number; description: string },
    rayssaExtra?: { amount: number; description: string }
  ) => {
    const timestamp = Date.now();
    const month = targetMonth || selectedMonth || '2026-09';
    const newTxs: Transaction[] = [];

    // Andrews: 5º dia útil
    if (andrews5 > 0) {
      newTxs.push({
        id: `tx-sal-andrews-${timestamp}-1`,
        description: 'Salário Andrews (5º Dia Útil)',
        amount: andrews5,
        type: 'income',
        category: 'Salário (5º Dia Útil)',
        date: `${month}-05`,
        paymentMethod: 'pix',
        status: 'completed',
        member: 'andrews',
        notes: 'Salário no 5º dia útil creditado (Andrews)',
      });
    }

    // Andrews: Vale
    if (andrewsAdv > 0) {
      newTxs.push({
        id: `tx-adv-andrews-${timestamp}-2`,
        description: 'Adiantamento Andrews (Vale)',
        amount: andrewsAdv,
        type: 'income',
        category: 'Adiantamento Salarial (Vale)',
        date: `${month}-20`,
        paymentMethod: 'pix',
        status: 'pending',
        member: 'andrews',
        notes: 'Vale quinzenal de Andrews dia 20',
      });
    }

    // Andrews: Entradas Diversas / Renda Extra (Bicos, Freelas, Vendas)
    if (andrewsExtra && andrewsExtra.amount > 0) {
      newTxs.push({
        id: `tx-extra-andrews-${timestamp}-3`,
        description: andrewsExtra.description || 'Entradas Diversas / Bicos (Andrews)',
        amount: andrewsExtra.amount,
        type: 'income',
        category: 'Entradas Diversas / Renda Extra',
        date: `${month}-15`,
        paymentMethod: 'pix',
        status: 'completed',
        member: 'andrews',
        notes: 'Entrada avulsa / renda extra de Andrews',
      });
    }

    // Rayssa: 5º dia útil
    if (rayssa5 > 0) {
      newTxs.push({
        id: `tx-sal-rayssa-${timestamp}-4`,
        description: 'Salário Rayssa (5º Dia Útil)',
        amount: rayssa5,
        type: 'income',
        category: 'Salário (5º Dia Útil)',
        date: `${month}-05`,
        paymentMethod: 'pix',
        status: 'completed',
        member: 'rayssa',
        notes: 'Salário no 5º dia útil creditado (Rayssa)',
      });
    }

    // Rayssa: Vale
    if (rayssaAdv > 0) {
      newTxs.push({
        id: `tx-adv-rayssa-${timestamp}-5`,
        description: 'Adiantamento Rayssa (Vale)',
        amount: rayssaAdv,
        type: 'income',
        category: 'Adiantamento Salarial (Vale)',
        date: `${month}-20`,
        paymentMethod: 'pix',
        status: 'pending',
        member: 'rayssa',
        notes: 'Vale quinzenal de Rayssa dia 20',
      });
    }

    // Rayssa: Entradas Diversas / Renda Extra
    if (rayssaExtra && rayssaExtra.amount > 0) {
      newTxs.push({
        id: `tx-extra-rayssa-${timestamp}-6`,
        description: rayssaExtra.description || 'Entradas Diversas (Rayssa)',
        amount: rayssaExtra.amount,
        type: 'income',
        category: 'Entradas Diversas / Renda Extra',
        date: `${month}-15`,
        paymentMethod: 'pix',
        status: 'completed',
        member: 'rayssa',
        notes: 'Entrada avulsa / renda extra de Rayssa',
      });
    }

    // Remover salários e entradas extras anteriores configuradas neste mês para evitar duplicações
    const cleanedBase = transactions.filter(
      (t) =>
        !(
          t.date.startsWith(month) &&
          t.type === 'income' &&
          (t.category.toLowerCase().includes('salário') ||
            t.category.toLowerCase().includes('salario') ||
            t.category.toLowerCase().includes('vale') ||
            t.category.toLowerCase().includes('adiantamento') ||
            t.category.toLowerCase().includes('diversas') ||
            t.description.toLowerCase().includes('salário') ||
            t.description.toLowerCase().includes('vale') ||
            t.description.toLowerCase().includes('entradas diversas'))
        )
    );

    const merged = [...newTxs, ...cleanedBase];
    setTransactions(merged);
    syncSaveMultipleTransactions(newTxs).catch(console.error);
    showToast('Salários e Entradas Diversas configurados e sincronizados na nuvem!');
  };

  // Limpar apenas as transações de exemplo/fictícias
  const handleClearDemoData = () => {
    const filtered = transactions.filter((t) => !isSeedTransaction(t));
    setTransactions(filtered);
    setDismissedDemoAlert(true);
    showToast('Dados de exemplo removidos! Agora apenas seus lançamentos reais estão visíveis.');
  };

  // Zerar 100% dos dados para começar limpo
  const handleClearAllData = () => {
    if (window.confirm('Tem certeza que deseja zerar tudo e começar do zero? Todos os dados atuais serão apagados deste celular e da nuvem sincronizada.')) {
      setTransactions([]);
      setCommitments([]);
      setGoals([]);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        localStorage.setItem(COMMITMENTS_STORAGE_KEY, JSON.stringify([]));
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify([]));
      } catch (err) {
        console.warn(err);
      }
      syncClearAllTransactions().catch(console.error);
      syncClearAllCommitments().catch(console.error);
      syncClearAllGoals().catch(console.error);
      setDismissedDemoAlert(true);
      showToast('Tudo zerado com sucesso! Pronto para começar do zero.');
    }
  };

  // Redefinir para manter estritamente 1 salário, 1 adiantamento e 1 despesa de R$ 55
  const handleApplyQuickSetup = (
    salaryAmount: number,
    advAmount: number,
    expenseAmount: number,
    targetMonth: string
  ) => {
    const timestamp = Date.now();
    const month = targetMonth || selectedMonth || '2026-09';
    const newTxs: Transaction[] = [];

    // 1. Salário 5º dia útil
    if (salaryAmount > 0) {
      newTxs.push({
        id: `tx-sal-${timestamp}`,
        description: 'Salário (5º Dia Útil)',
        amount: salaryAmount,
        type: 'income',
        category: 'Salário (5º Dia Útil)',
        date: `${month}-05`,
        paymentMethod: 'pix',
        status: 'completed',
        notes: 'Saldo líquido mensal recebido no 5º dia útil',
      });
    }

    // 2. Adiantamento salarial (vale do dia 20)
    if (advAmount > 0) {
      newTxs.push({
        id: `tx-adv-${timestamp}`,
        description: 'Adiantamento Salarial (Vale)',
        amount: advAmount,
        type: 'income',
        category: 'Adiantamento Salarial (Vale)',
        date: `${month}-20`,
        paymentMethod: 'pix',
        status: 'pending',
        notes: 'Adiantamento quinzenal previsto para o dia 20',
      });
    }

    // 3. Despesa única informada (ex: R$ 55,00)
    if (expenseAmount > 0) {
      newTxs.push({
        id: `tx-exp-${timestamp}`,
        description: 'Despesa Inicial',
        amount: expenseAmount,
        type: 'expense',
        category: 'Outros',
        date: `${month}-04`,
        paymentMethod: 'pix',
        status: 'completed',
        notes: 'Lançamento de despesa inicial',
      });
    }

    // Substitui tudo pelos 3 dados solicitados pelo usuário
    setTransactions(newTxs);
    setSelectedMonth(month);
    setDismissedDemoAlert(true);
    showToast('Pronto! Mantidos apenas seu Salário, Vale e a Despesa de R$ 55,00 (o resto foi zerado).');
  };

  // Remover apenas salários duplicados no mês selecionado
  const handleRemoveDuplicateSalaries = () => {
    setTransactions((prev) => {
      const monthPrefix = selectedMonth;
      let keptSal = false;
      let keptAdv = false;
      const result: Transaction[] = [];

      for (const tx of prev) {
        if (tx.date.startsWith(monthPrefix) && tx.type === 'income') {
          const isSal =
            tx.category === 'Salário (5º Dia Útil)' ||
            tx.description.toLowerCase().includes('5º') ||
            tx.description.toLowerCase().includes('5°') ||
            (tx.category.toLowerCase().includes('salário') && !tx.description.toLowerCase().includes('vale'));
          const isAdv =
            tx.category === 'Adiantamento Salarial (Vale)' ||
            tx.description.toLowerCase().includes('adiantamento') ||
            tx.description.toLowerCase().includes('vale');

          if (isSal) {
            if (!keptSal) {
              keptSal = true;
              result.push(tx);
            }
            continue;
          }
          if (isAdv) {
            if (!keptAdv) {
              keptAdv = true;
              result.push(tx);
            }
            continue;
          }
        }
        result.push(tx);
      }
      return result;
    });
    showToast('Salários e vales repetidos foram removidos com sucesso!');
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('Transação removida.');
    }
  };

  const handleToggleStatus = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
    showToast('Status da transação alterado.');
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Deseja carregar as transações de exemplo para teste? Isso preencherá dados de demonstração.'
      )
    ) {
      setTransactions(DEMO_TRANSACTIONS);
      setSelectedMonth('2026-09');
      showToast('Dados de exemplo carregados.');
    }
  };

  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `minhas_financas_${selectedMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Download do backup iniciado.');
  };

  const todayStr = getTodayStr();
  const todayCommitments = useMemo(() => {
    return commitments.filter((c) => c.date === todayStr);
  }, [commitments, todayStr]);

  const pendingEmergenciesCount = useMemo(() => {
    return todayCommitments.filter((c) => c.type === 'emergency' && !c.completed).length;
  }, [todayCommitments]);

  const pendingCommitmentsCount = useMemo(() => {
    return todayCommitments.filter((c) => !c.completed).length;
  }, [todayCommitments]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header with Navigation & Filters */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedMonth={selectedMonth}
        availableMonths={availableMonths}
        onMonthChange={setSelectedMonth}
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenNewInstallment={handleOpenNewInstallment}
        onOpenNewCommitment={() => handleOpenNewCommitmentModal('emergency')}
        pendingCommitmentsCount={pendingCommitmentsCount}
        pendingEmergenciesCount={pendingEmergenciesCount}
        onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
        onOpenCoupleSalaries={() => setIsCoupleSalaryModalOpen(true)}
        onResetData={handleResetData}
        onClearDemoData={handleClearDemoData}
        onClearAllData={handleClearAllData}
        hasDemoTransactions={hasDemoTransactions}
        onExportData={handleExportData}
        totalBalance={totalBalance}
        currentProfile={currentProfile}
        onProfileChange={handleProfileChange}
        selectedMemberFilter={selectedMemberFilter}
        onMemberFilterChange={setSelectedMemberFilter}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dispositivo e Filtro do Casal (Andrews & Rayssa) */}
        <div className="mb-6">
          <CoupleSelector
            currentProfile={currentProfile}
            onProfileChange={handleProfileChange}
            selectedFilter={selectedMemberFilter}
            onFilterChange={setSelectedMemberFilter}
          />
        </div>

        {/* Banner de esclarecimento e limpeza de dados de exemplo (exibido na página de Finanças ou Cartões se houver dados fictícios) */}
        {(currentTab === 'transactions' || currentTab === 'installments') && hasDemoTransactions && !dismissedDemoAlert && (
          <div
            id="banner-demo-data-notice"
            className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/95 border border-amber-200/90 text-slate-800 shadow-xs relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    Aparecem despesas de R$ 4.000+ e receitas acima de R$ 17.000?
                  </h3>
                  <p className="text-xs text-amber-900/90 mt-1 leading-relaxed max-w-3xl">
                    O aplicativo veio pré-carregado com <strong>dados fictícios de demonstração</strong> (despesas como Aluguel de R$ 2.450, Supermercado, contas e salários de exemplo).
                    Ao salvar o seu salário, os valores foram <strong>somados aos exemplos anteriores</strong>.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    <button
                      id="btn-quick-setup-banner"
                      type="button"
                      onClick={() => setIsQuickSetupOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Deixar Apenas Meu Salário, Vale e Despesa de R$ 55</span>
                    </button>

                    <button
                      id="btn-clear-demo-data"
                      type="button"
                      onClick={handleClearDemoData}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar Dados de Exemplo</span>
                    </button>

                    <button
                      id="btn-clear-all-data"
                      type="button"
                      onClick={handleClearAllData}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>Zerar Tudo</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDismissedDemoAlert(true)}
                className="text-amber-700 hover:text-amber-900 p-1.5 rounded-lg hover:bg-amber-100/60 transition-colors self-end sm:self-start"
                title="Dispensar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* Página 1: Início (Home Hub com Resumos Executivos e Acesso Rápido) */}
        {(currentTab === 'home' || currentTab === 'dashboard') && (
          <HomePage
            stats={currentMonthStats}
            transactions={transactions}
            commitments={commitments}
            goals={goals}
            onNavigateTab={setCurrentTab}
            onOpenNewTransaction={handleOpenNewTransaction}
            onOpenNewInstallment={handleOpenNewInstallment}
            onOpenNewCommitment={(type) => handleOpenNewCommitmentModal(type || 'emergency')}
            onToggleCommitment={handleToggleCommitment}
            onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
            onOpenSplitSalary={handleOpenSplitSalaryModal}
            onOpenCoupleSalaries={() => setIsCoupleSalaryModalOpen(true)}
          />
        )}

        {/* Página 2: Agenda & Socorros do Dia & Metas */}
        {currentTab === 'agenda' && (
          <AgendaView
            commitments={commitments}
            onToggleComplete={handleToggleCommitment}
            onOpenNewModal={handleOpenNewCommitmentModal}
            onEditCommitment={handleEditCommitmentModal}
            onDeleteCommitment={handleDeleteCommitment}
            onClearCompleted={handleClearCompletedCommitments}
            onRestoreDefaults={handleRestoreDefaultCommitments}
            selectedDate={selectedAgendaDate}
            onDateChange={setSelectedAgendaDate}
            goals={goals}
            onSaveGoal={handleSaveGoal}
            onToggleGoal={handleToggleGoal}
            onDeleteGoal={handleDeleteGoal}
            activeProfile={currentProfile}
          />
        )}

        {/* Página 3: Finanças & Lançamentos */}
        {currentTab === 'transactions' && (
          <FinancesPage
            stats={currentMonthStats}
            transactions={transactions}
            selectedMonth={selectedMonth}
            onOpenNewTransaction={handleOpenNewTransaction}
            onOpenSplitSalary={handleOpenSplitSalaryModal}
            onOpenQuickSetup={() => setIsQuickSetupOpen(true)}
            onOpenCoupleSalaries={() => setIsCoupleSalaryModalOpen(true)}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onToggleStatus={handleToggleStatus}
            hasDemoTransactions={hasDemoTransactions}
            onClearDemoData={handleClearDemoData}
            onClearAllData={handleClearAllData}
            onRemoveDuplicateSalaries={handleRemoveDuplicateSalaries}
            goals={goals}
            onSaveGoal={handleSaveGoal}
            onToggleGoal={handleToggleGoal}
            onDeleteGoal={handleDeleteGoal}
            activeProfile={currentProfile}
            onAddSavingsTransaction={handleAddSavingsTransaction}
          />
        )}

        {/* Página 4: Cartão & Compras Parceladas */}
        {currentTab === 'installments' && (
          <InstallmentsPage
            transactions={transactions}
            onOpenNewInstallment={handleOpenNewInstallment}
            onToggleStatus={handleToggleStatus}
            onDeleteGroup={handleDeleteInstallmentGroup}
          />
        )}

        {/* Página 5: Gráficos & Relatórios */}
        {(currentTab === 'reports' || currentTab === 'monthly_report') && (
          <ReportsAnalyticsPage
            stats={currentMonthStats}
            historicalTrend={historicalTrend}
            transactions={transactions}
            onOpenNewTransaction={handleOpenNewTransaction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-5 text-center text-xs text-slate-400 border-t border-slate-200 bg-white/50 print:hidden">
        <p className="font-medium text-slate-600">
          <span className="font-extrabold text-slate-900 tracking-wider">NEXUS</span> • couple finance & life management
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Controle financeiro conjunto de Andrews & Rayssa, metas de economia e gestão de vida
        </p>
      </footer>

      {/* Active Audio Alarm Popup */}
      <ActiveAlertNotification
        commitment={activeAlert}
        onDismiss={dismissAlert}
        onMarkAsDone={(id) => {
          handleToggleCommitment(id);
          dismissAlert();
        }}
        onSnooze5Min={snooze5Min}
      />

      {/* Commitment & Daily Emergencies Modal */}
      <CommitmentModal
        isOpen={isCommitmentModalOpen}
        onClose={() => setIsCommitmentModalOpen(false)}
        onSave={handleSaveCommitment}
        commitmentToEdit={commitmentToEdit}
        defaultDate={selectedAgendaDate}
        defaultType={commitmentModalType}
        activeProfile={currentProfile}
      />

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        onSaveMultiple={handleSaveMultipleTransactions}
        onDelete={handleDeleteTransaction}
        transactionToEdit={transactionToEdit}
        defaultDate={selectedMonth}
        initialMode={modalInitialMode}
        activeProfile={currentProfile}
      />

      {/* Quick Setup Modal (1 Salário + 1 Vale + 1 Despesa R$ 55) */}
      <QuickSetupModal
        isOpen={isQuickSetupOpen}
        onClose={() => setIsQuickSetupOpen(false)}
        onApply={handleApplyQuickSetup}
        existingTransactions={transactions}
        currentMonth={selectedMonth}
      />

      {/* Couple Salary Modal (Salários Andrews & Rayssa) */}
      <CoupleSalaryModal
        isOpen={isCoupleSalaryModalOpen}
        onClose={() => setIsCoupleSalaryModalOpen(false)}
        onSaveSalaries={handleSaveCoupleSalaries}
        currentMonth={selectedMonth}
        existingTransactions={transactions}
      />
    </div>
  );
}
