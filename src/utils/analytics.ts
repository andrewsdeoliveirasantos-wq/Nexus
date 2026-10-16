import { Transaction, MonthlyStats } from '../types.ts';
import { ALL_CATEGORIES, PAYMENT_METHODS, getCategoryColor } from '../data/categories.ts';
import { formatMonthName } from './formatters.ts';

export function getAvailableMonths(transactions: Transaction[]): string[] {
  const monthsSet = new Set<string>();
  transactions.forEach((tx) => {
    if (tx.date) {
      monthsSet.add(tx.date.substring(0, 7));
    }
  });

  // Ensure current month '2026-09' is in the list
  monthsSet.add('2026-09');

  return Array.from(monthsSet).sort().reverse();
}

export function calculateMonthlyStats(transactions: Transaction[], targetMonth: string): MonthlyStats {
  const currentMonthTxs = transactions.filter(
    (tx) => tx.date.startsWith(targetMonth)
  );

  let totalIncome = 0;
  let totalExpense = 0;
  let pendingExpense = 0;
  let pendingIncome = 0;

  // Couple breakdown
  let andrewsIncome = 0;
  let rayssaIncome = 0;
  let andrewsExpense = 0;
  let rayssaExpense = 0;
  let bothExpense = 0;

  const categoryExpenseMap = new Map<string, number>();
  const categoryIncomeMap = new Map<string, number>();
  const paymentMethodMap = new Map<string, number>();
  const dailyExpenseMap = new Map<string, number>();

  currentMonthTxs.forEach((tx) => {
    const isRayssa = tx.member === 'rayssa' || tx.description.toLowerCase().includes('rayssa');
    const isBoth = tx.member === 'both';

    if (tx.type === 'income') {
      totalIncome += tx.amount;
      if (tx.status === 'pending') {
        pendingIncome += tx.amount;
      }
      if (isRayssa) {
        rayssaIncome += tx.amount;
      } else {
        andrewsIncome += tx.amount;
      }
      const currentVal = categoryIncomeMap.get(tx.category) || 0;
      categoryIncomeMap.set(tx.category, currentVal + tx.amount);
    } else {
      totalExpense += tx.amount;
      if (tx.status === 'pending') {
        pendingExpense += tx.amount;
      }
      if (isRayssa) {
        rayssaExpense += tx.amount;
      } else if (isBoth) {
        bothExpense += tx.amount;
      } else {
        andrewsExpense += tx.amount;
      }
      const currentVal = categoryExpenseMap.get(tx.category) || 0;
      categoryExpenseMap.set(tx.category, currentVal + tx.amount);

      // Payment method for expenses
      const currentPm = paymentMethodMap.get(tx.paymentMethod) || 0;
      paymentMethodMap.set(tx.paymentMethod, currentPm + tx.amount);

      // Daily expenses
      const dayStr = tx.date;
      const currentDayVal = dailyExpenseMap.get(dayStr) || 0;
      dailyExpenseMap.set(dayStr, currentDayVal + tx.amount);
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Category Expense breakdown
  const categoryExpenses = Array.from(categoryExpenseMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      color: getCategoryColor(name),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Category Income breakdown
  const categoryIncomes = Array.from(categoryIncomeMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
      color: getCategoryColor(name),
    }))
    .sort((a, b) => b.amount - a.amount);

  // Payment method breakdown
  const paymentMethodDistribution = Array.from(paymentMethodMap.entries())
    .map(([method, amount]) => {
      const pm = PAYMENT_METHODS.find((p) => p.id === method);
      return {
        method,
        label: pm ? pm.label : method,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Daily expenses array for chart
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dailyExpenses: { date: string; day: string; amount: number }[] = [];
  let highestExpenseDay: { date: string; amount: number } | null = null;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayPad = d.toString().padStart(2, '0');
    const fullDate = `${targetMonth}-${dayPad}`;
    const amount = dailyExpenseMap.get(fullDate) || 0;
    dailyExpenses.push({
      date: fullDate,
      day: `${dayPad}/${monthStr}`,
      amount,
    });

    if (amount > 0 && (!highestExpenseDay || amount > highestExpenseDay.amount)) {
      highestExpenseDay = { date: fullDate, amount };
    }
  }

  // Top 5 individual expenses
  const topExpenses = currentMonthTxs
    .filter((tx) => tx.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const daysPassed = targetMonth === '2026-09' ? 4 : daysInMonth;
  const dailyAverageExpense = totalExpense > 0 ? totalExpense / Math.max(1, daysPassed) : 0;

  // Previous month stats for comparison
  const prevDate = new Date(year, month - 2, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
  
  const prevMonthTxs = transactions.filter((tx) => tx.date.startsWith(prevMonthKey));
  let prevIncome = 0;
  let prevExpense = 0;
  prevMonthTxs.forEach((tx) => {
    if (tx.type === 'income') prevIncome += tx.amount;
    else prevExpense += tx.amount;
  });
  const prevSavings = prevIncome - prevExpense;

  const incomeChangePercent = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseChangePercent = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;
  const savingsChangePercent = prevSavings !== 0 ? ((netSavings - prevSavings) / Math.abs(prevSavings)) * 100 : 0;

  return {
    monthKey: targetMonth,
    monthName: formatMonthName(targetMonth),
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    pendingExpense,
    pendingIncome,
    andrewsIncome,
    rayssaIncome,
    andrewsExpense,
    rayssaExpense,
    bothExpense,
    dailyExpenses,
    categoryExpenses,
    categoryIncomes,
    paymentMethodDistribution,
    topExpenses,
    dailyAverageExpense,
    highestExpenseDay,
    comparisonWithPrevious: {
      incomeChangePercent,
      expenseChangePercent,
      savingsChangePercent,
    },
  };
}

export function calculateHistoricalTrend(
  transactions: Transaction[],
  limitMonths: number = 6
): { monthKey: string; label: string; receitas: number; despesas: number; saldo: number }[] {
  const allMonths = getAvailableMonths(transactions);
  const selectedMonths = allMonths.slice(0, limitMonths).reverse();

  return selectedMonths.map((m) => {
    const monthTxs = transactions.filter((tx) => tx.date.startsWith(m));
    let receitas = 0;
    let despesas = 0;
    monthTxs.forEach((t) => {
      if (t.type === 'income') receitas += t.amount;
      else despesas += t.amount;
    });
    const [, monthNumStr] = m.split('-');
    const shortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const shortLabel = `${shortNames[parseInt(monthNumStr, 10) - 1]}/${m.substring(2, 4)}`;

    return {
      monthKey: m,
      label: shortLabel,
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  });
}
