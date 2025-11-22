import { useMonths, useCurrentMonth } from '../hooks/useMonths';
import { MonthSelect } from './MonthSelect';

interface MonthSelectorProps {
  selectedMonthId: number | null;
  onMonthChange: (monthId: number) => void;
}

export const MonthSelector = ({ selectedMonthId, onMonthChange }: MonthSelectorProps) => {
  const { data: months, isLoading } = useMonths();
  const { data: currentMonth } = useCurrentMonth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading months...</div>
      </div>
    );
  }

  if (!months || months.length === 0) {
    return null;
  }

  // Months are sorted newest first (year desc, month desc)
  // So: index 0 = newest, index N = oldest
  // Previous = older month (higher index)
  // Next = newer month (lower index)

  // Find current index
  const currentIndex = selectedMonthId
    ? months.findIndex((m) => m.id === selectedMonthId)
    : currentMonth
      ? months.findIndex((m) => m.id === currentMonth.id)
      : -1;

  // Previous = go to older month (higher index)
  const canGoPrev = currentIndex >= 0 && currentIndex < months.length - 1;
  // Next = go to newer month (lower index)
  const canGoNext = currentIndex > 0;

  const handlePrev = () => {
    if (canGoPrev && currentIndex >= 0 && currentIndex < months.length - 1) {
      onMonthChange(months[currentIndex + 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext && currentIndex > 0) {
      onMonthChange(months[currentIndex - 1].id);
    }
  };

  const activeMonth = months.find((m) => m.id === selectedMonthId) || currentMonth || months[0];

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrev}
        disabled={!canGoPrev}
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <MonthSelect
        months={months}
        value={activeMonth.id}
        onChange={onMonthChange}
        className="min-w-[180px]"
        label=""
      />

      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next month"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};
