import React from 'react';
import {
  Printer,
  FileCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Split,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { MonthlyStats, Transaction } from '../types.ts';
import { formatCurrency, formatPercent, formatDateBR } from '../utils/formatters.ts';

interface MonthlyReportViewProps {
  stats: MonthlyStats;
  transactions: Transaction[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  stats,
  transactions,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isSurplus = stats.netSavings >= 0;
  const topCategory = stats.categoryExpenses[0] || null;
  const secondCategory = stats.categoryExpenses[1] || null;

  // Generate automated executive narrative
  const generateExecutiveSummary = () => {
    const lines: string[] = [];

    if (stats.totalIncome === 0 && stats.totalExpense === 0) {
      return 'Nenhuma movimentação registrada no mês selecionado.';
    }

    // 1. Overall balance
    if (isSurplus) {
      lines.push(
        `O mês de ${stats.monthName} fechou com superávit de ${formatCurrency(stats.netSavings)}, registrando uma taxa de poupança de ${stats.savingsRate.toFixed(1)}% sobre as receitas totais.`
      );
    } else {
      lines.push(
        `O mês de ${stats.monthName} encerrou com déficit de ${formatCurrency(Math.abs(stats.netSavings))}, indicando que as despesas ultrapassaram as entradas financeiras.`
      );
    }

    // 2. Salary Breakdown (5º Dia Útil & Adiantamento)
    const monthTx = transactions.filter((t) => t.date.startsWith(stats.monthKey) && t.type === 'income');
    const s5 = monthTx.find(
      (t) =>
        t.category === 'Salário (5º Dia Útil)' ||
        t.description.toLowerCase().includes('5º dia útil') ||
        t.description.toLowerCase().includes('5° dia útil')
    );
    const adv = monthTx.find(
      (t) =>
        t.category === 'Adiantamento Salarial (Vale)' ||
        t.description.toLowerCase().includes('adiantamento') ||
        t.description.toLowerCase().includes('vale')
    );

    if (s5 && adv) {
      lines.push(
        `Os proventos salariais contemplaram o saldo líquido do 5º dia útil (${formatCurrency(s5.amount)}) e o adiantamento salarial quinzenal (${formatCurrency(adv.amount)}), totalizando ${formatCurrency(s5.amount + adv.amount)}.`
      );
    } else if (s5) {
      lines.push(`Os proventos computaram a parcela de salário do 5º dia útil de ${formatCurrency(s5.amount)}.`);
    }

    // 3. Spending categories
    if (topCategory) {
      lines.push(
        `A principal fonte de despesa foi "${topCategory.name}", que consumiu ${formatCurrency(topCategory.amount)} (${topCategory.percentage.toFixed(1)}% do total de saídas).` +
        (secondCategory ? ` Em seguida, "${secondCategory.name}" representou ${formatCurrency(secondCategory.amount)} (${secondCategory.percentage.toFixed(1)}%).` : '')
      );
    }

    // 4. Comparison with previous month
    if (stats.comparisonWithPrevious.expenseChangePercent !== 0) {
      const expChange = stats.comparisonWithPrevious.expenseChangePercent;
      if (expChange < 0) {
        lines.push(
          `Em relação ao mês anterior, houve uma economia positiva com redução de ${Math.abs(expChange).toFixed(1)}% nos gastos totais.`
        );
      } else {
        lines.push(
          `Houve um acréscimo de ${expChange.toFixed(1)}% nas despesas totais em comparação com o mês anterior.`
        );
      }
    }

    // 5. Daily average
    if (stats.dailyAverageExpense > 0) {
      lines.push(
        `O gasto médio diário apurado no período foi de ${formatCurrency(stats.dailyAverageExpense)}.`
      );
    }

    return lines.join(' ');
  };

  const monthTransactions = transactions.filter((t) => t.date.startsWith(stats.monthKey));

  const salary5Tx = monthTransactions.find(
    (t) =>
      t.type === 'income' &&
      (t.category === 'Salário (5º Dia Útil)' ||
        t.description.toLowerCase().includes('5º dia útil') ||
        t.description.toLowerCase().includes('5° dia útil'))
  );

  const advSalaryTx = monthTransactions.find(
    (t) =>
      t.type === 'income' &&
      (t.category === 'Adiantamento Salarial (Vale)' ||
        t.description.toLowerCase().includes('adiantamento') ||
        t.description.toLowerCase().includes('vale'))
  );

  return (
    <div id="monthly-report-container" className="space-y-6">
      {/* Report Action Bar (Hidden when printing) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Relatório Mensal Automatizado
            </h2>
            <p className="text-xs text-slate-500">
              Gerado instantaneamente com base nos lançamentos de {stats.monthName}
            </p>
          </div>
        </div>

        <button
          id="print-report-btn"
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Salvar em PDF</span>
        </button>
      </div>

      {/* Official Report Document Page */}
      <div
        id="printable-report-paper"
        className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8 print:p-0 print:border-none print:shadow-none"
      >
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
                Demonstrativo Financeiro Mensal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Relatório de {stats.monthName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Período de referência: {stats.monthKey}-01 até {stats.monthKey}-31 • Moeda: Real Brasileiro (BRL)
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400">Status Geral do Período</div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                  isSurplus
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isSurplus ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Superavitário (+{stats.savingsRate.toFixed(1)}%)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Déficit Mensal</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Executivo Inteligente (Automated synthesis) */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Resumo Executivo do Mês
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">
            {generateExecutiveSummary()}
          </p>
        </div>

        {/* 4 Indicadores-Chave */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Receitas Totais</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              {formatCurrency(stats.totalIncome)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stats.comparisonWithPrevious.incomeChangePercent !== 0 && (
                <span>{formatPercent(stats.comparisonWithPrevious.incomeChangePercent)} vs mês anterior</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Despesas Totais</span>
            <div className="text-xl font-bold text-rose-600 mt-1">
              {formatCurrency(stats.totalExpense)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stats.comparisonWithPrevious.expenseChangePercent !== 0 && (
                <span>{formatPercent(stats.comparisonWithPrevious.expenseChangePercent)} vs mês anterior</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Saldo Líquido</span>
            <div className={`text-xl font-bold mt-1 ${isSurplus ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(stats.netSavings)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Taxa de Poupança: {stats.savingsRate.toFixed(1)}%
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Média Diária de Gastos</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(stats.dailyAverageExpense)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {monthTransactions.filter((t) => t.type === 'expense').length} saídas registradas
            </div>
          </div>
        </div>

        {/* Composição dos Proventos e Salário Dividido */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-emerald-600" />
              Composição dos Proventos • Salário Dividido
            </h4>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
              Total Entradas: {formatCurrency(stats.totalIncome)}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Salário 5º Dia Útil */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">1ª Entrada (Saldo Líquido)</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">Salário (5º Dia Útil)</div>
              <div className="text-base font-extrabold text-emerald-600 mt-1">
                {salary5Tx ? formatCurrency(salary5Tx.amount) : 'R$ 0,00'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {salary5Tx ? formatDateBR(salary5Tx.date) : 'Aprox. dia 05'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${salary5Tx?.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {salary5Tx?.status === 'completed' ? 'Recebido' : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Adiantamento Salarial (Vale) */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">2ª Entrada (Quinzenal)</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">Adiantamento Salarial (Vale)</div>
              <div className="text-base font-extrabold text-teal-600 mt-1">
                {advSalaryTx ? formatCurrency(advSalaryTx.amount) : 'R$ 0,00'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {advSalaryTx ? formatDateBR(advSalaryTx.date) : 'Aprox. dia 20'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${advSalaryTx?.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {advSalaryTx?.status === 'completed' ? 'Recebido' : 'Previsto'}
                </span>
              </div>
            </div>

            {/* Proporção e conciliação */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Distribuição Salarial</div>
                <div className="text-xs font-medium text-slate-700 mt-1">
                  {salary5Tx && advSalaryTx ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>5º Dia Útil ({((salary5Tx.amount / (salary5Tx.amount + advSalaryTx.amount)) * 100).toFixed(0)}%):</span>
                        <span className="font-bold">{formatCurrency(salary5Tx.amount)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Vale Quinzenal ({((advSalaryTx.amount / (salary5Tx.amount + advSalaryTx.amount)) * 100).toFixed(0)}%):</span>
                        <span className="font-bold">{formatCurrency(advSalaryTx.amount)}</span>
                      </div>
                    </div>
                  ) : (
                    <span>Proventos recebidos de forma escalonada no mês.</span>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                Permite conciliar despesas do início do mês e compromissos da 2ª quinzena.
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos de Gastos do Relatório */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Análise Visual de Gastos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico 1: Despesas por Categoria (Donut) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Composição das Despesas por Categoria
              </h4>

              {stats.categoryExpenses.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  Nenhuma despesa para exibir neste mês.
                </div>
              ) : (
                <>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.categoryExpenses}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={2}
                        >
                          {stats.categoryExpenses.map((entry) => (
                            <Cell key={`rep-cell-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number | string | undefined) => [
                            formatCurrency(typeof val === 'number' ? val : Number(val || 0)),
                            'Total',
                          ]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend list */}
                  <div className="mt-2 space-y-1">
                    {stats.categoryExpenses.slice(0, 4).map((c) => (
                      <div key={c.name} className="flex justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="text-slate-600 truncate">{c.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {c.percentage.toFixed(1)}% ({formatCurrency(c.amount)})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Gráfico 2: Evolução Diária no Mês */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Concentração Diária de Despesas
              </h4>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.dailyExpenses}
                    margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} interval={3} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(val: number | string | undefined) => [
                        formatCurrency(typeof val === 'number' ? val : Number(val || 0)),
                        'Despesa',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="amount" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 text-xs text-slate-500 flex justify-between">
                <span>Pico de saída:</span>
                <span className="font-semibold text-rose-600">
                  {stats.highestExpenseDay
                    ? `${formatDateBR(stats.highestExpenseDay.date)} (${formatCurrency(
                        stats.highestExpenseDay.amount
                      )})`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Detalhamento por Categoria */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
            Detalhamento Analítico por Categoria
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Valor Gasto</th>
                  <th className="py-2.5 px-3 text-right">% do Total</th>
                  <th className="py-2.5 px-3 text-center">Impacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.categoryExpenses.map((cat) => (
                  <tr key={cat.name} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(cat.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {cat.percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          cat.percentage > 30
                            ? 'bg-rose-50 text-rose-700'
                            : cat.percentage > 15
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cat.percentage > 30 ? 'Alto Impacto' : cat.percentage > 15 ? 'Médio Impacto' : 'Moderado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Maiores Despesas do Mês */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
            Top 5 Maiores Despesas Individuais
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.topExpenses.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {formatDateBR(tx.date)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {tx.description}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{tx.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recomendações Financeiras Finais */}
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 text-xs space-y-1.5">
          <h4 className="font-bold text-indigo-900">
            Orientações para o Próximo Ciclo:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            {stats.savingsRate < 20 ? (
              <li>
                Sua taxa de poupança ({stats.savingsRate.toFixed(1)}%) ficou abaixo dos 20% recomendados. Tente revisar as categorias de lazer ou despesas não essenciais.
              </li>
            ) : (
              <li>
                Excelente disciplina financeira! Você poupou {stats.savingsRate.toFixed(1)}% dos seus proventos. Considere direcionar o excedente para sua reserva de emergência ou investimentos.
              </li>
            )}
            {topCategory && topCategory.percentage > 35 && (
              <li>
                A categoria &quot;{topCategory.name}&quot; consumiu mais de um terço do total gasto. Avalie se há margem para renegociação ou otimização nestes custos fixos.
              </li>
            )}
            <li>
              Mantenha o hábito de lançar os gastos diariamente para que o próximo fechamento automático continue 100% calibrado.
            </li>
          </ul>
        </div>

        {/* Footer do Relatório */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Relatório gerado automaticamente por Controle Financeiro</span>
          <span>Data de emissão: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
};
