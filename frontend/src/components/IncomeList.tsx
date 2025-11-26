import { useState } from 'react';
import { useIncomes, useDeleteIncome } from '../hooks/useIncomes';
import { usePeriods } from '../hooks/usePeriods';
import { useIncomeTypes } from '../hooks/useIncomeTypes';
import { IncomeForm } from './IncomeForm';
import type { Income } from '../types';
import { useDialog } from '../contexts/DialogContext';

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
  const deleteMutation = useDeleteIncome();
  const { showConfirm, showAlert } = useDialog();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading incomes...</div>
      </div>
    );
  }

  return (
    <div className="mx-2 sm:mx-4 my-4 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Income List
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm sm:text-base rounded-lg font-medium transition-colors shadow-sm"
        >
          <span className="hidden sm:inline">+ Add Income</span>
          <span className="sm:hidden">+ Add</span>
        </button>
      </div>

      {showForm && <IncomeForm onClose={() => setShowForm(false)} defaultMonthId={monthId} />}

      {editingIncome && (
        <IncomeForm
          income={editingIncome}
          onClose={() => setEditingIncome(null)}
          defaultMonthId={monthId}
        />
      )}

      <div className="mt-4 overflow-x-hidden">
        {!incomes || incomes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No incomes found.</p>
            <p className="text-sm mt-2">Add your first income to get started!</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet: 2-column grid */}
            <div className="lg:hidden grid grid-cols-2 gap-2 sm:gap-3 w-full">
              {incomes.map((income) => {
                const incomeType = getIncomeType(income.income_type_id);
                return (
                  <div
                    key={income.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 space-y-2 min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      {incomeType && (
                        <div
                          className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                          style={{ backgroundColor: incomeType.color }}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {incomeType?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                        style={{ backgroundColor: getPeriodColor(income.period) }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {income.period}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Budget:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        ${income.budget.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ${income.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setEditingIncome(income)}
                        className="flex-1 text-xs px-2 py-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 border border-primary-300 dark:border-primary-700 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="flex-1 text-xs px-2 py-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Income Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {incomes.map((income) => {
                    const incomeType = getIncomeType(income.income_type_id);
                    return (
                      <tr key={income.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {incomeType && (
                              <div
                                className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                                style={{ backgroundColor: incomeType.color }}
                              />
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {incomeType?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                              style={{ backgroundColor: getPeriodColor(income.period) }}
                            />
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {income.period}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            ${income.budget.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ${income.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setEditingIncome(income)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(income.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
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
