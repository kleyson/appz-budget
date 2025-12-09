import { useState } from 'react';
import { useMonthlyTrends } from '../hooks/useReports';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/format';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, Payload } from 'recharts/types/component/DefaultTooltipContent';

interface CustomTooltipProps extends TooltipProps<number, NameType> {
  active?: boolean;
  payload?: Payload<number, NameType>[];
  label?: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  isCurrency = true,
  isPercentage = false,
}: CustomTooltipProps) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    return (
      <div
        className={`p-3 rounded-lg shadow-lg border ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <p
          className={`font-semibold mb-2 ${
            theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
          }`}
        >
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm">
            {entry.name}:{' '}
            <span style={{ color: entry.color }}>
              {isPercentage
                ? `${(entry.value ?? 0).toFixed(1)}%`
                : isCurrency
                  ? formatCurrency(entry.value ?? 0)
                  : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const Reports = () => {
  const [numMonths, setNumMonths] = useState(12);
  const { data: trends, isLoading, error } = useMonthlyTrends(numMonths);
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#f3f4f6' : '#111827';
  const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-500 dark:text-red-400 text-lg">Error loading reports</p>
      </div>
    );
  }

  if (!trends || trends.months.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No data available for reports. Start by adding expenses and income.
        </p>
      </div>
    );
  }

  // Prepare data for cash flow chart
  const cashFlowData = trends.months.map((month) => ({
    name: month.month_name,
    Income: month.total_income,
    Expenses: month.total_expenses,
    'Net Savings': month.net_savings,
  }));

  // Prepare data for category spending chart
  // Get all unique categories across all months
  const allCategories = new Set<string>();
  const categoryColors: Record<string, string> = {};
  trends.months.forEach((month) => {
    month.categories.forEach((cat) => {
      allCategories.add(cat.category);
      categoryColors[cat.category] = cat.color;
    });
  });

  const categorySpendingData = trends.months.map((month) => {
    const dataPoint: Record<string, string | number> = { name: month.month_name };
    allCategories.forEach((cat) => {
      const categoryData = month.categories.find((c) => c.category === cat);
      dataPoint[cat] = categoryData?.amount ?? 0;
    });
    return dataPoint;
  });

  // Prepare data for savings rate chart
  const savingsRateData = trends.months.map((month) => ({
    name: month.month_name,
    'Savings Rate': month.savings_rate,
    'Net Savings': month.net_savings,
  }));

  return (
    <div className="mx-2 sm:mx-4 my-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Financial Reports
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your financial progress over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Show last:</label>
          <select
            value={numMonths}
            onChange={(e) => setNumMonths(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={18}>18 months</option>
            <option value={24}>24 months</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl text-white">
          <p className="text-emerald-100 text-sm font-medium">Avg. Monthly Income</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(trends.average_income)}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-4 rounded-xl text-white">
          <p className="text-rose-100 text-sm font-medium">Avg. Monthly Expenses</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(trends.average_expenses)}</p>
        </div>
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-xl text-white">
          <p className="text-primary-100 text-sm font-medium">Avg. Savings Rate</p>
          <p className="text-2xl font-bold mt-1">{trends.average_savings_rate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Chart 1: Monthly Cash Flow */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Cash Flow
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Track income vs expenses and net savings over time
        </p>
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={cashFlowData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke={textColor}
                fontSize={11}
                interval={0}
              />
              <YAxis stroke={textColor} fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: textColor }} />
              <Line
                type="monotone"
                dataKey="Income"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Net Savings"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <ReferenceLine y={0} stroke={textColor} strokeOpacity={0.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Category Spending Trend */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Category Spending Trend
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          See how your spending by category changes over time
        </p>
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={categorySpendingData}
              margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke={textColor}
                fontSize={11}
                interval={0}
              />
              <YAxis stroke={textColor} fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: textColor }} />
              {Array.from(allCategories).map((category) => (
                <Bar
                  key={category}
                  dataKey={category}
                  stackId="categories"
                  fill={categoryColors[category]}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Savings Rate Trend */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Savings Rate Trend
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Monitor your savings rate percentage over time (higher is better)
        </p>
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={savingsRateData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                stroke={textColor}
                fontSize={11}
                interval={0}
              />
              <YAxis
                stroke={textColor}
                fontSize={11}
                tickFormatter={(v) => `${v}%`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip isPercentage />} />
              <Legend wrapperStyle={{ color: textColor }} />
              <ReferenceLine y={0} stroke={textColor} strokeOpacity={0.5} />
              <ReferenceLine
                y={20}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeOpacity={0.7}
                label={{
                  value: 'Target 20%',
                  position: 'right',
                  fill: '#10b981',
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="Savings Rate"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#savingsGradient)"
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
