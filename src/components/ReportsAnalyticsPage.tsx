import React, { useState } from 'react';
import {
  FileBarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
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
  Line,
  ComposedChart,
} from 'recharts';
import { MonthlyStats, Transaction } from '../types.ts';
import { formatCurrency, formatPercent } from '../utils/formatters.ts';
import { MonthlyReportView } from './MonthlyReportView.tsx';

interface ReportsAnalyticsPageProps {
  stats: MonthlyStats;
  historicalTrend: { monthKey: string; label: string; receitas: number; despesas: number; saldo: number }[];
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
}

export const ReportsAnalyticsPage: React.FC<ReportsAnalyticsPageProps> = ({
  stats,
  historicalTrend,
  transactions,
  onOpenNewTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'printable'>('charts');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  return (
    <div id="reports-analytics-page" className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold mb-3 border border-sky-200/60">
            <FileBarChart2 className="w-3.5 h-3.5" />
            <span>Página de Inteligência & Relatórios</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Gráficos & Relatórios Mensais
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Consulte a evolução visual das suas despesas por categoria, histórico dos últimos meses e gere o relatório executivo oficial do mês de {stats.monthName}.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70 self-start md:self-auto shrink-0">
          <button
            id="btn-subtab-charts"
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5 text-sky-600" />
            <span>Gráficos & Análises</span>
          </button>

          <button
            id="btn-subtab-printable"
            type="button"
            onClick={() => setActiveTab('printable')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'printable'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Relatório para Impressão</span>
          </button>
        </div>
      </div>

      {activeTab === 'printable' ? (
        <MonthlyReportView stats={stats} transactions={transactions} />
      ) : (
        <div className="space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Média Diária de Gastos
              </span>
              <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
                {formatCurrency(stats.dailyAverageExpense)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Considerando os dias do mês com despesas
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Taxa de Poupança
              </span>
              <div className="text-2xl font-bold text-emerald-600 tracking-tight mt-2">
                {stats.savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.savingsRate >= 20 ? 'Meta de 20%+ atingida!' : 'Ideal: guardar acima de 20%'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dia de Maior Despesa
              </span>
              <div className="text-2xl font-bold text-rose-600 tracking-tight mt-2">
                {stats.highestExpenseDay ? formatCurrency(stats.highestExpenseDay.amount) : 'R$ 0,00'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.highestExpenseDay ? `Dia ${stats.highestExpenseDay.date.split('-')[2]}` : 'Sem gastos registrados'}
              </p>
            </div>
          </div>

          {/* Charts Row: Category Breakdown & Historical Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Donut: Despesas por Categoria */}
            <div
              id="chart-category-donut"
              className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-slate-500" />
                      Gastos por Categoria
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Distribuição percentual no mês de {stats.monthName}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {stats.categoryExpenses.length} categorias
                  </span>
                </div>

                {stats.categoryExpenses.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                    <p>Nenhuma despesa registrada neste mês.</p>
                    <button
                      type="button"
                      onClick={onOpenNewTransaction}
                      className="mt-3 text-indigo-600 font-semibold hover:underline"
                    >
                      + Adicionar primeiro gasto
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryExpenses}
                            dataKey="amount"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                            onMouseLeave={() => setActiveCategoryIndex(null)}
                          >
                            {stats.categoryExpenses.map((entry, index) => (
                              <Cell
                                key={`cell-${entry.name}`}
                                fill={entry.color}
                                opacity={
                                  activeCategoryIndex === null || activeCategoryIndex === index
                                    ? 1
                                    : 0.4
                                }
                                stroke="#ffffff"
                                strokeWidth={2}
                              />
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
                              borderRadius: '10px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {stats.categoryExpenses.map((cat, idx) => (
                        <div
                          key={cat.name}
                          onMouseEnter={() => setActiveCategoryIndex(idx)}
                          onMouseLeave={() => setActiveCategoryIndex(null)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            activeCategoryIndex === idx ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-slate-700 truncate">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-slate-500 font-medium">
                              {cat.percentage.toFixed(1)}%
                            </span>
                            <span className="text-slate-900 font-bold">
                              {formatCurrency(cat.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Evolução Histórica (6 Meses) */}
            <div
              id="chart-historical-trend"
              className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                    Evolução Financeira dos Últimos Meses
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comparativo de Receitas, Despesas e Saldo Líquido
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                    <span className="text-slate-600 font-medium">Receitas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                    <span className="text-slate-600 font-medium">Despesas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-indigo-600" />
                    <span className="text-slate-600 font-medium">Saldo</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={historicalTrend}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: number | string | undefined, name: string | number | undefined) => [
                        formatCurrency(typeof val === 'number' ? val : Number(val || 0)),
                        name === 'receitas'
                          ? 'Receitas'
                          : name === 'despesas'
                          ? 'Despesas'
                          : 'Saldo Líquido',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar
                      dataKey="receitas"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                      name="receitas"
                    />
                    <Bar
                      dataKey="despesas"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      barSize={18}
                      name="despesas"
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ fill: '#4f46e5', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="saldo"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Gráfico: Despesas Diárias ao Longo do Mês */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Evolução Diária de Gastos em {stats.monthName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Identifique os dias de pico de consumo financeiro
                </p>
              </div>
            </div>

            <div className="pt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.dailyExpenses}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `R$${val}`}
                  />
                  <Tooltip
                    formatter={(val: number | string | undefined) => [
                      formatCurrency(typeof val === 'number' ? val : Number(val || 0)),
                      'Gasto no Dia',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#6366f1"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
