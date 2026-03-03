import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useExpensePeriodSummary } from '../../hooks/useSummary';
import { formatCurrency } from '../../utils/format';

interface BudgetComparisonChartProps {
  monthId?: number | null;
}

export const BudgetComparisonChart = ({ monthId = null }: BudgetComparisonChartProps) => {
  const { data: expensePeriodSummary, isLoading } = useExpensePeriodSummary({
    month_id: monthId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        Loading...
      </div>
    );
  }

  if (!expensePeriodSummary || expensePeriodSummary.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        No period data available.
      </div>
    );
  }

  const chartData = expensePeriodSummary.map((item) => ({
    name: item.period,
    Budgeted: item.budget,
    Actual: item.total,
    overBudget: item.over_budget,
  }));

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4 bg-white dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        Budgeted vs Actual by Period
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #1e293b)',
                border: '1px solid var(--tooltip-border, #334155)',
                borderRadius: '8px',
                color: 'var(--tooltip-text, #e2e8f0)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="Budgeted" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="Actual" radius={[0, 4, 4, 0]} barSize={12}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.overBudget ? '#ef4444' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
