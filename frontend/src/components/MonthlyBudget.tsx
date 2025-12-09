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
import {
  Card,
  CardHeader,
  Tabs,
  PageTitle,
  Button,
  BarChartIcon,
  WalletIcon,
  DollarIcon,
  LineChartIcon,
  PlusIcon,
  TrashIcon,
  CloneIcon,
} from './shared';
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
      icon: <BarChartIcon className="w-4 h-4" />,
    },
    {
      id: 'list',
      label: 'Expenses',
      icon: <WalletIcon className="w-4 h-4" />,
    },
    {
      id: 'income',
      label: 'Income',
      icon: <DollarIcon className="w-4 h-4" />,
    },
    {
      id: 'charts',
      label: 'Charts',
      icon: <LineChartIcon className="w-4 h-4" />,
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
              icon={<PlusIcon className="w-4 h-4" />}
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
                  icon={<TrashIcon className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">
                    {deleteMonthMutation.isPending ? 'Deleting...' : 'Delete'}
                  </span>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCloneToNextMonth}
                  disabled={cloneMutation.isPending}
                  icon={<CloneIcon className="w-4 h-4" />}
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
      <div className="overflow-x-auto">
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
