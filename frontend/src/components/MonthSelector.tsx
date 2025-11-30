import { useMonths, useCurrentMonth, useCloseMonth, useOpenMonth } from '../hooks/useMonths';
import { MonthSelect } from './MonthSelect';
import { useDialog } from '../contexts/DialogContext';

interface MonthSelectorProps {
  selectedMonthId: number | null;
  onMonthChange: (monthId: number) => void;
}

export const MonthSelector = ({ selectedMonthId, onMonthChange }: MonthSelectorProps) => {
  const { data: months, isLoading } = useMonths();
  const { data: currentMonth } = useCurrentMonth();
  const closeMonthMutation = useCloseMonth();
  const openMonthMutation = useOpenMonth();
  const { showConfirm, showAlert } = useDialog();

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

  const handleToggleClose = async () => {
    if (!activeMonth) return;

    if (activeMonth.is_closed) {
      // Open month
      const confirmed = await showConfirm({
        title: 'Reopen Month',
        message: `Are you sure you want to reopen "${activeMonth.name}"? This will allow adding new expenses and incomes.`,
        type: 'warning',
        confirmText: 'Reopen',
        cancelText: 'Cancel',
      });

      if (confirmed) {
        try {
          const result = await openMonthMutation.mutateAsync(activeMonth.id);
          await showAlert({
            title: 'Month Reopened',
            message: result.message,
            type: 'success',
          });
        } catch (error) {
          console.error('Error reopening month:', error);
          await showAlert({
            title: 'Error',
            message: 'Failed to reopen month. Please try again.',
            type: 'error',
          });
        }
      }
    } else {
      // Close month
      const confirmed = await showConfirm({
        title: 'Close Month',
        message: `Are you sure you want to close "${activeMonth.name}"? No new expenses or incomes can be added until it's reopened.`,
        type: 'warning',
        confirmText: 'Close',
        cancelText: 'Cancel',
      });

      if (confirmed) {
        try {
          const result = await closeMonthMutation.mutateAsync(activeMonth.id);
          await showAlert({
            title: 'Month Closed',
            message: result.message,
            type: 'success',
          });
        } catch (error) {
          console.error('Error closing month:', error);
          await showAlert({
            title: 'Error',
            message: 'Failed to close month. Please try again.',
            type: 'error',
          });
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          <MonthSelect
            months={months}
            value={activeMonth.id}
            onChange={onMonthChange}
            className="min-w-[140px] sm:min-w-[180px]"
            label=""
          />
          {activeMonth.is_closed && (
            <span className="px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Closed
            </span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next month"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <button
        onClick={handleToggleClose}
        disabled={closeMonthMutation.isPending || openMonthMutation.isPending}
        className={`p-1.5 sm:p-2 rounded-lg border transition-colors ${
          activeMonth.is_closed
            ? 'border-green-300 dark:border-green-700 bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
            : 'border-red-300 dark:border-red-700 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={activeMonth.is_closed ? 'Reopen month' : 'Close month'}
      >
        {activeMonth.is_closed ? (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        )}
      </button>
    </div>
  );
};
