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
import { Card, CardHeader, Tabs, PageTitle, Button } from './shared';
import type { Tab } from './shared';

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
      let defaultMonth = currentMonth;

      if (currentMonth?.is_closed && months.length > 0) {
        const currentIdx = months.findIndex((m) => m.id === currentMonth.id);

        for (let i = currentIdx - 1; i >= 0; i--) {
          if (!months[i].is_closed) {
            defaultMonth = months[i];
            break;
          }
        }
      }

      if (defaultMonth) {
        setSelectedMonthId(defaultMonth.id);
      } else if (months.length > 0) {
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

  const tabs: Tab[] = [
    {
      id: 'summary',
      label: 'Summary',
      icon: <SummaryIcon />,
    },
    {
      id: 'list',
      label: 'Expenses',
      icon: <ExpenseIcon />,
    },
    {
      id: 'income',
      label: 'Income',
      icon: <IncomeIcon />,
    },
    {
      id: 'charts',
      label: 'Charts',
      icon: <ChartIcon />,
    },
  ];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <PageTitle subtitle="Track your expenses and income">Monthly Budget</PageTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="success"
              onClick={() => setIsCreateMonthModalOpen(true)}
              icon={<PlusIcon />}
            >
              <span className="hidden sm:inline">Create Month</span>
              <span className="sm:hidden">Create</span>
            </Button>
            {selectedMonthId && (
              <>
                <Button
                  variant="danger"
                  onClick={handleDeleteMonth}
                  disabled={deleteMonthMutation.isPending}
                  icon={<TrashIcon />}
                >
                  <span className="hidden sm:inline">
                    {deleteMonthMutation.isPending ? 'Deleting...' : 'Delete'}
                  </span>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCloneToNextMonth}
                  disabled={cloneMutation.isPending}
                  icon={<CloneIcon />}
                >
                  <span className="hidden sm:inline">
                    {cloneMutation.isPending ? 'Cloning...' : 'Clone to Next'}
                  </span>
                  <span className="sm:hidden">{cloneMutation.isPending ? '...' : 'Clone'}</span>
                </Button>
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
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as ExpensesTabId)}
        />
      </CardHeader>

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
    </Card>
  );
};

// Icons
const SummaryIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const ExpenseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const IncomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const CloneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);
