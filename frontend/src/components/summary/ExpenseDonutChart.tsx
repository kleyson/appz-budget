import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useCategorySummary, useCategories } from '../../hooks/useCategories';
import { formatCurrency } from '../../utils/format';

interface ExpenseDonutChartProps {
  monthId?: number | null;
}

export const ExpenseDonutChart = ({ monthId = null }: ExpenseDonutChartProps) => {
  const { data: summary, isLoading } = useCategorySummary({ month_id: monthId });
  const { data: categories } = useCategories();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        Loading...
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        No expense data available.
      </div>
    );
  }

  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c) => c.name === categoryName);
    return category?.color || '#8b5cf6';
  };

  const chartData = summary
    .filter((item) => item.total > 0)
    .map((item) => ({
      name: item.category,
      value: item.total,
      color: getCategoryColor(item.category),
    }));

  const totalExpenses = summary.reduce((acc, item) => acc + item.total, 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        No expenses to display.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/50 p-4 bg-white dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        Expenses by Category
      </h3>
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Amount']}
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, #1e293b)',
                border: '1px solid var(--tooltip-border, #334155)',
                borderRadius: '8px',
                color: 'var(--tooltip-text, #e2e8f0)',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
