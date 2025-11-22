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
              ${entry.value?.toFixed(2)}
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
    <div className="mx-4 my-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Budget Analysis</h3>
      <div className="flex flex-col gap-6">
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Budget vs Actual by Category
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                stroke={textColor}
                fontSize={12}
              />
              <YAxis stroke={textColor} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: textColor }} />
              <Bar dataKey="budget" fill="#8b5cf6" name="Budget" />
              <Bar dataKey="total" fill="#10b981" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Budget Distribution
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="budget"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
