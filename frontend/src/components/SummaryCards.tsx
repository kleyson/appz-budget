import { useSummaryTotals } from '../hooks/useSummary';

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
      title: 'Total Budgeted Expenses',
      value: totals.total_budgeted_expenses,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Expenses',
      value: totals.total_current_expenses,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Total Budgeted Income',
      value: totals.total_budgeted_income,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Current Income',
      value: totals.total_current_income,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Total Budgeted',
      value: totals.total_budgeted,
      color:
        totals.total_budgeted >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Total Current',
      value: totals.total_current,
      color:
        totals.total_current >= 0
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 px-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {card.title}
          </div>
          <div
            className={`text-3xl font-bold ${
              card.value === 0 ? 'text-gray-400 dark:text-gray-500' : card.color
            }`}
          >
            ${Math.abs(card.value).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
};
