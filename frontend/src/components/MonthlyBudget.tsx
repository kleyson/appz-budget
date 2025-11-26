import { useState, useEffect } from 'react';
import { ExpenseList } from './ExpenseList';
import { IncomeList } from './IncomeList';
import { Summary } from './Summary';
import { SummaryCards } from './SummaryCards';
import { Charts } from './Charts';
import { MonthSelector } from './MonthSelector';
import { FilterBar } from './FilterBar';
import { CreateMonthModal } from './CreateMonthModal';
import { usePeriods } from '../hooks/usePeriods';
import { useCategories } from '../hooks/useCategories';
import { useCurrentMonth, useDeleteMonth, useMonths } from '../hooks/useMonths';
import { useCloneExpensesToNextMonth } from '../hooks/useExpenses';
import { useDialog } from '../contexts/DialogContext';

type ExpensesTabId = 'list' | 'income' | 'summary' | 'charts';

export const MonthlyBudget = () => {
  const [activeTab, setActiveTab] = useState<ExpensesTabId>('summary');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null);
  const [isCreateMonthModalOpen, setIsCreateMonthModalOpen] = useState(false);

  const { data: periods } = usePeriods();
  const { data: categories } = useCategories();
  const { data: currentMonth } = useCurrentMonth();
  const { data: months } = useMonths();
  const cloneMutation = useCloneExpensesToNextMonth();
  const deleteMonthMutation = useDeleteMonth();
  const { showAlert, showConfirm } = useDialog();

  // Set initial month to current month
  useEffect(() => {
    if (currentMonth && selectedMonthId === null) {
      setSelectedMonthId(currentMonth.id);
    }
  }, [currentMonth, selectedMonthId]);

  const handleCloneToNextMonth = async () => {
    if (!selectedMonthId) {
      await showAlert({
        title: 'No Month Selected',
        message: 'Please select a month to clone from',
        type: 'warning',
      });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Clone to Next Month',
      message:
        'This will clone all expenses and incomes from the selected month to the following month. Only budget values will be cloned (costs, purchases, and income amounts will be reset). Continue?',
      type: 'info',
      confirmText: 'Clone',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      const result = await cloneMutation.mutateAsync(selectedMonthId);
      await showAlert({
        title: 'Success',
        message: result.message,
        type: 'success',
      });
      // Optionally switch to the next month
      if (result.next_month_id) {
        setSelectedMonthId(result.next_month_id);
      }
    } catch (error) {
      console.error('Error cloning expenses:', error);
      await showAlert({
        title: 'Error',
        message: 'Failed to clone expenses. Please try again.',
        type: 'error',
      });
    }
  };

  const handleDeleteMonth = async () => {
    if (!selectedMonthId) {
      await showAlert({
        title: 'No Month Selected',
        message: 'Please select a month to delete',
        type: 'warning',
      });
      return;
    }

    const monthToDelete = months?.find((m) => m.id === selectedMonthId);
    const monthName = monthToDelete?.name || 'this month';

    const confirmed = await showConfirm({
      title: 'Delete Month',
      message: `Are you sure you want to delete "${monthName}"? This will permanently delete the month and ALL associated expenses and incomes. This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteMonthMutation.mutateAsync(selectedMonthId);
      await showAlert({
        title: 'Success',
        message: `Month "${monthName}" and all associated data have been deleted successfully.`,
        type: 'success',
      });

      // Switch to another month if available
      const remainingMonths = months?.filter((m) => m.id !== selectedMonthId) || [];
      if (remainingMonths.length > 0) {
        setSelectedMonthId(remainingMonths[0].id);
      } else {
        setSelectedMonthId(null);
      }
    } catch (error) {
      console.error('Error deleting month:', error);
      await showAlert({
        title: 'Error',
        message: 'Failed to delete month. Please try again.',
        type: 'error',
      });
    }
  };

  const tabs: { id: ExpensesTabId; label: string; icon: string }[] = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'list', label: 'Expenses', icon: '💰' },
    { id: 'income', label: 'Income', icon: '💵' },
    { id: 'charts', label: 'Charts', icon: '📈' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-hidden">
      {/* Header with filters */}
      <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Monthly Budget
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateMonthModalOpen(true)}
              className="
                px-2 py-1.5 sm:px-3 sm:py-2 bg-green-600 hover:bg-green-700
                text-white text-sm font-medium rounded-lg
                transition-colors
                flex items-center gap-1.5
              "
              title="Create a new empty month"
            >
              <span>➕</span>
              <span className="hidden sm:inline">Create Month</span>
              <span className="sm:hidden">Create</span>
            </button>
            {selectedMonthId && (
              <>
                <button
                  onClick={handleDeleteMonth}
                  disabled={deleteMonthMutation.isPending}
                  className="
                    px-2 py-1.5 sm:px-3 sm:py-2 bg-red-600 hover:bg-red-700
                    text-white text-sm font-medium rounded-lg
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-1.5
                  "
                  title="Delete this month and all associated expenses and incomes"
                >
                  <span>🗑️</span>
                  <span className="hidden sm:inline">
                    {deleteMonthMutation.isPending ? 'Deleting...' : 'Delete Month'}
                  </span>
                  <span className="sm:hidden">
                    {deleteMonthMutation.isPending ? '...' : 'Delete'}
                  </span>
                </button>
                <button
                  onClick={handleCloneToNextMonth}
                  disabled={cloneMutation.isPending}
                  className="
                    px-2 py-1.5 sm:px-3 sm:py-2 bg-primary-600 hover:bg-primary-700
                    text-white text-sm font-medium rounded-lg
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-1.5
                  "
                  title="Clone all expenses and incomes from this month to the next month"
                >
                  <span>📋</span>
                  <span className="hidden sm:inline">
                    {cloneMutation.isPending ? 'Cloning...' : 'Clone to Next Month'}
                  </span>
                  <span className="sm:hidden">{cloneMutation.isPending ? '...' : 'Clone'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <MonthSelector selectedMonthId={selectedMonthId} onMonthChange={setSelectedMonthId} />
          {(activeTab === 'list' || activeTab === 'income') && (
            <FilterBar
              periods={periods}
              categories={categories}
              selectedPeriod={selectedPeriod}
              selectedCategory={selectedCategory}
              onPeriodChange={setSelectedPeriod}
              onCategoryChange={setSelectedCategory}
              showCategoryFilter={activeTab === 'list'}
            />
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap
                  transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-0 overflow-x-hidden">
        {activeTab === 'list' && (
          <ExpenseList
            periodFilter={selectedPeriod || null}
            categoryFilter={selectedCategory || null}
            monthId={selectedMonthId}
          />
        )}
        {activeTab === 'income' && (
          <IncomeList periodFilter={selectedPeriod || null} monthId={selectedMonthId} />
        )}
        {activeTab === 'summary' && (
          <>
            <SummaryCards periodFilter={selectedPeriod || null} monthId={selectedMonthId} />
            <Summary periodFilter={selectedPeriod || null} monthId={selectedMonthId} />
          </>
        )}
        {activeTab === 'charts' && <Charts />}
      </div>

      <CreateMonthModal
        isOpen={isCreateMonthModalOpen}
        onClose={() => setIsCreateMonthModalOpen(false)}
        onSuccess={(monthId) => {
          setSelectedMonthId(monthId);
          setIsCreateMonthModalOpen(false);
        }}
      />
    </div>
  );
};
