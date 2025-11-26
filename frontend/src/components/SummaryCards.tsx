import { useSummaryTotals } from '../hooks/useSummary';
import { formatCurrency } from '../utils/format';

interface SummaryCardsProps {
  periodFilter?: string | null;
  monthId?: number | null;
}

export const SummaryCards = ({ periodFilter = null, monthId = null }: SummaryCardsProps) => {
  const { data: totals, isLoading } = useSummaryTotals({ period: periodFilter, month_id: monthId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading summary...</div>
      </div>
    );
  }

  if (!totals) {
    return null;
  }

  const cards = [
    {
      title: 'Budgeted Expenses Total',
      value: totals.total_budgeted_expenses,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Expenses Total',
      value: totals.total_current_expenses,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Budgeted Income Total',
      value: totals.total_budgeted_income,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Income Total',
      value: totals.total_current_income,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Budgeted Total',
      value: totals.total_budgeted,
      color:
        totals.total_budgeted >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Total',
      value: totals.total_current,
      color:
        totals.total_current >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="mx-2 sm:mx-4 my-4">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {card.title}
            </div>
            <div
              className={`text-3xl font-bold text-right ${
                card.value === 0 ? 'text-gray-400 dark:text-gray-500' : card.color
              }`}
            >
              {formatCurrency(Math.abs(card.value))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
