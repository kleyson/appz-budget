import { useCategorySummary, useCategories } from '../hooks/useCategories';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/format';
import type { TooltipProps } from 'recharts';
import type { NameType, Payload } from 'recharts/types/component/DefaultTooltipContent';

interface CustomTooltipProps extends TooltipProps<number, NameType> {
  active?: boolean;
  payload?: Payload<number, NameType>[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
            <span
              style={{
                color: entry.value === 0 ? '#9ca3af' : entry.color,
              }}
            >
              {formatCurrency(entry.value ?? 0)}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ChartsProps {}

export const Charts = ({}: ChartsProps) => {
  const { data: summary, isLoading } = useCategorySummary();
  const { data: categories } = useCategories();
  const { theme } = useTheme();

  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c) => c.name === categoryName);
    return category?.color || '#8b5cf6';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading charts...</div>
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No data available for charts</p>
      </div>
    );
  }

  const chartData = summary.map((item) => ({
    name: item.category,
    budget: item.budget,
    total: item.total,
  }));

  const textColor = theme === 'dark' ? '#f3f4f6' : '#111827';
  const gridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb';

  return (
    <div className="mx-2 sm:mx-4 my-4">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6 px-2">
        Budget Analysis
      </h3>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Budget vs Actual by Category
          </h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={300} minHeight={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke={textColor}
                  fontSize={10}
                  interval={0}
                />
                <YAxis stroke={textColor} fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: textColor }} />
                <Bar dataKey="budget" fill="#8b5cf6" name="Budget" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#10b981" name="Actual" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Budget Distribution
          </h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={300} minHeight={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const percentage = ((percent ?? 0) * 100).toFixed(0);
                    // Only show label if percentage is significant
                    return parseFloat(percentage) >= 5 ? `${name}: ${percentage}%` : '';
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="budget"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: textColor }}
                  formatter={(value) => (
                    <span style={{ color: textColor, fontSize: '12px' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
