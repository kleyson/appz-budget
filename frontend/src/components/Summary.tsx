import { useCategorySummary, useCategories } from '../hooks/useCategories';
import { useIncomeTypeSummary } from '../hooks/useSummary';
import { useIncomeTypes } from '../hooks/useIncomeTypes';
import { isDarkColor } from '../utils/colors';
import { formatCurrency } from '../utils/format';

interface SummaryProps {
  periodFilter?: string | null;
  monthId?: number | null;
}

export const Summary = ({ periodFilter = null, monthId = null }: SummaryProps) => {
  const { data: summary, isLoading } = useCategorySummary({
    month_id: monthId,
  });
  const { data: categories } = useCategories();
  const { data: incomeTypeSummary, isLoading: isLoadingIncomeSummary } = useIncomeTypeSummary({
    period: periodFilter,
    month_id: monthId,
  });
  const { data: incomeTypes } = useIncomeTypes();

  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c) => c.name === categoryName);
    return category?.color || '#8b5cf6';
  };

  const getIncomeTypeColor = (incomeTypeName: string): string => {
    const incomeType = incomeTypes?.find((it) => it.name === incomeTypeName);
    return incomeType?.color || '#10b981';
  };

  if (isLoading || isLoadingIncomeSummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading summary...</div>
      </div>
    );
  }

  return (
    <div className="mx-4 my-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Expenses by Category
      </h3>

      <div className="overflow-x-auto mb-8">
        {!summary || summary.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No category summary data available.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {summary?.map((item) => {
                const difference = item.budget - item.total;
                const isWithinBudget = !item.over_budget;
                return (
                  <tr
                    key={item.category}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getCategoryColor(item.category),
                          color: isDarkColor(getCategoryColor(item.category))
                            ? '#ffffff'
                            : '#111827',
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                        item.budget === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(item.budget)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                        item.total === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(item.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isWithinBudget
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {isWithinBudget ? '✅ On Budget' : '🔴 Over Budget'}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        difference === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : difference >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(difference)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Income Summary</h3>

      <div className="overflow-x-auto">
        {!incomeTypeSummary || incomeTypeSummary.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No income type summary data available.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Income Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {incomeTypeSummary?.map((item) => {
                const difference = item.total - item.budget;
                return (
                  <tr
                    key={item.income_type}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getIncomeTypeColor(item.income_type),
                          color: isDarkColor(getIncomeTypeColor(item.income_type))
                            ? '#ffffff'
                            : '#111827',
                        }}
                      >
                        {item.income_type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                        item.budget === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(item.budget)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                        item.total === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {formatCurrency(item.total)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        difference === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : difference >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(difference)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
