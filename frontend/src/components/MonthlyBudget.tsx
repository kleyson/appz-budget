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

  useEffect(() => {
    if (selectedMonthId === null && months && months.length > 0) {
      // Find the best default month:
      // 1. Start with current month
      // 2. If current month is closed, find the closest non-closed month looking to the future first
      // 3. If no future non-closed month exists, fall back to current month

      let defaultMonth = currentMonth;

      if (currentMonth?.is_closed && months.length > 0) {
        // Months are sorted newest first (year desc, month desc)
        // Find current month index
        const currentIdx = months.findIndex((m) => m.id === currentMonth.id);

        // Look for non-closed months in the future (lower indices = newer months)
        for (let i = currentIdx - 1; i >= 0; i--) {
          if (!months[i].is_closed) {
            defaultMonth = months[i];
            break;
          }
        }

        // If no future non-closed month found, keep current month as default
      }

      if (defaultMonth) {
        setSelectedMonthId(defaultMonth.id);
      } else if (months.length > 0) {
        // Fallback to first available month
        setSelectedMonthId(months[0].id);
      }
    }
  }, [currentMonth, months, selectedMonthId]);

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

  const tabs: { id: ExpensesTabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'summary',
      label: 'Summary',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: 'list',
      label: 'Expenses',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      id: 'income',
      label: 'Income',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'charts',
      label: 'Charts',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="glass-card-solid rounded-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-5 lg:p-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              Monthly Budget
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track your expenses and income
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateMonthModalOpen(true)}
              className="btn-success text-sm px-3 py-2"
              title="Create a new empty month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Create Month</span>
              <span className="sm:hidden">Create</span>
            </button>
            {selectedMonthId && (
              <>
                <button
                  onClick={handleDeleteMonth}
                  disabled={deleteMonthMutation.isPending}
                  className="btn-danger text-sm px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete this month and all associated expenses and incomes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {deleteMonthMutation.isPending ? 'Deleting...' : 'Delete'}
                  </span>
                </button>
                <button
                  onClick={handleCloneToNextMonth}
                  disabled={cloneMutation.isPending}
                  className="btn-primary text-sm px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Clone all expenses and incomes from this month to the next month"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {cloneMutation.isPending ? 'Cloning...' : 'Clone to Next'}
                  </span>
                  <span className="sm:hidden">{cloneMutation.isPending ? '...' : 'Clone'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap mb-5">
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
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium
                transition-all duration-200 whitespace-nowrap min-w-fit
                ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <span className={activeTab === tab.id ? 'text-primary-500' : ''}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="overflow-x-hidden">
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
