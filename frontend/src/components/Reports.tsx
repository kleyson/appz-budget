import { useState } from 'react';
import {
  useMonthlyTrends,
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useBackupDownloadUrl,
} from '../hooks/useReports';
import { useAuth } from '../contexts/AuthContext';
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

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const Reports = () => {
  const [numMonths, setNumMonths] = useState(12);
  const { data: trends, isLoading, error } = useMonthlyTrends(numMonths);
  const { user } = useAuth();
  const { theme } = useTheme();

  // Backup hooks
  const { data: backupsData, isLoading: backupsLoading } = useBackups();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const getDownloadUrl = useBackupDownloadUrl();

  const textColor = theme === 'dark' ? '#f3f4f6' : '#111827';
  const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';

  const handleDownload = async (filename: string) => {
    try {
      const result = await getDownloadUrl.mutateAsync(filename);
      // Open the signed URL in a new tab to trigger download
      window.open(result.download_url, '_blank');
    } catch {
      console.error('Failed to get download URL');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup.mutateAsync();
    } catch {
      console.error('Failed to create backup');
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        await deleteBackup.mutateAsync(filename);
      } catch {
        console.error('Failed to delete backup');
      }
    }
  };

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

      {/* Database Backups Section (Admin Only) */}
      {user?.is_admin && (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Database Backups
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatic daily backups at 2 AM. Download or create manual backups.
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={createBackup.isPending}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
            >
              {createBackup.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Backup
                </>
              )}
            </button>
          </div>

          {backupsLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading backups...
            </div>
          ) : backupsData?.backups && backupsData.backups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Filename
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Size
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {backupsData.backups.map((backup) => (
                    <tr
                      key={backup.filename}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {backup.filename}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {formatFileSize(backup.size)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(backup.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(backup.filename)}
                            disabled={getDownloadUrl.isPending}
                            className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
                            title="Download backup"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.filename)}
                            disabled={deleteBackup.isPending}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Delete backup"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No backups available. Create your first backup using the button above.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
