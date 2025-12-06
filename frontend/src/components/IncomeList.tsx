import { useState } from 'react';
import { useIncomes, useDeleteIncome } from '../hooks/useIncomes';
import { usePeriods } from '../hooks/usePeriods';
import { useIncomeTypes } from '../hooks/useIncomeTypes';
import { useMonth } from '../hooks/useMonths';
import { IncomeForm } from './IncomeForm';
import type { Income } from '../types';
import { formatCurrency } from '../utils/format';
import { useDialog } from '../contexts/DialogContext';
import {
  LoadingState,
  EmptyState,
  SectionTitle,
  Button,
  Badge,
  ColorChip,
  IconButton,
} from './shared';

interface IncomeListProps {
  periodFilter?: string | null;
  monthId?: number | null;
}

export const IncomeList = ({ periodFilter = null, monthId = null }: IncomeListProps) => {
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: incomes, isLoading } = useIncomes({
    period: periodFilter,
    month_id: monthId,
  });
  const { data: periods } = usePeriods();
  const { data: incomeTypes } = useIncomeTypes();
  const { data: currentMonthData } = useMonth(monthId || 0);
  const deleteMutation = useDeleteIncome();
  const { showConfirm, showAlert } = useDialog();

  const isMonthClosed = currentMonthData?.is_closed ?? false;

  const getPeriodColor = (periodName: string): string => {
    const period = periods?.find((p) => p.name === periodName);
    return period?.color || '#8b5cf6';
  };

  const getIncomeType = (incomeTypeId: number) => {
    return incomeTypes?.find((it) => it.id === incomeTypeId);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Delete Income',
      message: 'Are you sure you want to delete this income?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting income:', error);
        await showAlert({
          title: 'Error',
          message: 'Failed to delete income. Please try again.',
          type: 'error',
        });
      }
    }
  };

  const getStatusInfo = (budget: number, amount: number) => {
    const percentage = budget > 0 ? (amount / budget) * 100 : 0;
    if (amount >= budget) {
      return { variant: 'success' as const, label: 'Complete' };
    } else if (percentage >= 50) {
      return { variant: 'warning' as const, label: 'Partial' };
    }
    return { variant: 'muted' as const, label: 'Pending' };
  };

  if (isLoading) {
    return <LoadingState text="Loading incomes..." />;
  }

  return (
    <div className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <SectionTitle>Income</SectionTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {incomes?.length || 0} {incomes?.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          disabled={isMonthClosed}
          icon={<PlusIcon />}
          title={isMonthClosed ? 'Month is closed' : undefined}
        >
          <span className="hidden sm:inline">Add Income</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {showForm && <IncomeForm onClose={() => setShowForm(false)} defaultMonthId={monthId} />}

      {editingIncome && (
        <IncomeForm
          income={editingIncome}
          onClose={() => setEditingIncome(null)}
          defaultMonthId={monthId}
        />
      )}

      <div className="mt-4">
        {!incomes || incomes.length === 0 ? (
          <EmptyState
            icon={<IncomeIcon />}
            title="No income yet"
            description="Add your first income to start tracking your earnings."
          />
        ) : (
          <>
            {/* Mobile/Tablet: Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incomes?.map((income, index) => {
                const incomeType = getIncomeType(income.income_type_id);
                const statusInfo = getStatusInfo(income.budget, income.amount);
                return (
                  <div
                    key={income.id}
                    className="bg-white dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-4 card-hover animate-slide-up opacity-0"
                    style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-slate-900 dark:text-white truncate pr-2">
                        {incomeType?.name || 'Unknown'}
                      </h4>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {incomeType && (
                        <ColorChip color={incomeType.color}>{incomeType.name}</ColorChip>
                      )}
                      <ColorChip color={getPeriodColor(income.period)}>{income.period}</ColorChip>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Budget</p>
                        <p
                          className={`font-semibold tabular-nums ${
                            income.budget === 0
                              ? 'text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {formatCurrency(income.budget)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                          Received
                        </p>
                        <p
                          className={`font-semibold tabular-nums ${
                            income.amount === 0
                              ? 'text-slate-400 dark:text-slate-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatCurrency(income.amount)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setEditingIncome(income)}
                        disabled={isMonthClosed}
                        className="flex-1 text-sm px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        disabled={isMonthClosed}
                        className="flex-1 text-sm px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-700/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Income Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/50">
                  {incomes.map((income) => {
                    const incomeType = getIncomeType(income.income_type_id);
                    const statusInfo = getStatusInfo(income.budget, income.amount);
                    return (
                      <tr
                        key={income.id}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-medium">
                          <ColorChip color={incomeType?.color || '#8b5cf6'}>
                            {incomeType?.name || 'Unknown'}
                          </ColorChip>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <ColorChip color={getPeriodColor(income.period)}>
                            {income.period}
                          </ColorChip>
                        </td>
                        <td
                          className={`px-4 py-4 text-sm text-right font-medium tabular-nums ${
                            income.budget === 0
                              ? 'text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {formatCurrency(income.budget)}
                        </td>
                        <td
                          className={`px-4 py-4 text-sm text-right font-medium tabular-nums ${
                            income.amount === 0
                              ? 'text-slate-400 dark:text-slate-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatCurrency(income.amount)}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconButton
                              variant="primary"
                              icon={<EditIcon />}
                              onClick={() => setEditingIncome(income)}
                              disabled={isMonthClosed}
                              title={isMonthClosed ? 'Month is closed' : 'Edit'}
                            />
                            <IconButton
                              variant="danger"
                              icon={<TrashIcon />}
                              onClick={() => handleDelete(income.id)}
                              disabled={isMonthClosed}
                              title={isMonthClosed ? 'Month is closed' : 'Delete'}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const IncomeIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
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
