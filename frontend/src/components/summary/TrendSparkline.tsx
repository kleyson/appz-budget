import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMonthlyTrends } from '../../hooks/useSummary';
import { formatCurrency } from '../../utils/format';

export const TrendSparkline = () => {
  const { data, isLoading } = useMonthlyTrends({ num_months: 6 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500">
        Loading...
      </div>
    );
  }

  if (!data || data.months.length === 0) {
    return null;
  }

  const chartData = data.months.map((m) => ({
    name: m.month_name,
    Income: m.total_income,
    Expenses: m.total_expenses,
  }));

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4 bg-white dark:bg-slate-900 mb-6">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        6-Month Trend
      </h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
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
            <Area
              type="monotone"
              dataKey="Income"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#incomeGradient)"
            />
            <Area
              type="monotone"
              dataKey="Expenses"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#expenseGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
