import React, { useState } from 'react';
import { useExpenses, useDeleteExpense } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { usePeriods } from '../hooks/usePeriods';
import { ExpenseForm } from './ExpenseForm';
import type { Expense } from '../types';
import { isDarkColor } from '../utils/colors';
import { formatCurrency } from '../utils/format';
import { useDialog } from '../contexts/DialogContext';

interface ExpenseListProps {
  periodFilter?: string | null;
  categoryFilter?: string | null;
  monthId?: number | null;
}

export const ExpenseList = ({
  periodFilter = null,
  categoryFilter = null,
  monthId = null,
}: ExpenseListProps) => {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedPurchases, setExpandedPurchases] = useState<Set<number>>(new Set());

  const { data: expenses, isLoading } = useExpenses({
    period: periodFilter,
    category: categoryFilter,
    month_id: monthId,
  });
  const { data: categories } = useCategories();
  const { data: periods } = usePeriods();
  const deleteMutation = useDeleteExpense();
  const { showConfirm, showAlert } = useDialog();

  // Helper functions to get colors
  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c) => c.name === categoryName);
    return category?.color || '#8b5cf6';
  };

  const getPeriodColor = (periodName: string): string => {
    const period = periods?.find((p) => p.name === periodName);
    return period?.color || '#8b5cf6';
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting expense:', error);
        await showAlert({
          title: 'Error',
          message: 'Failed to delete expense. Please try again.',
          type: 'error',
        });
      }
    }
  };

  const togglePurchases = (expenseId: number) => {
    setExpandedPurchases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (budget: number, cost: number) => {
    const isWithinBudget = budget >= cost;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isWithinBudget
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}
      >
        {isWithinBudget ? '✅ On Budget' : '🔴 Over Budget'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="mx-2 sm:mx-4 my-4 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Expense List
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm sm:text-base rounded-lg font-medium transition-colors shadow-sm"
        >
          <span className="hidden sm:inline">+ Add Expense</span>
          <span className="sm:hidden">+ Add</span>
        </button>
      </div>

      {showForm && <ExpenseForm onClose={() => setShowForm(false)} defaultMonthId={monthId} />}

      {editingExpense && (
        <ExpenseForm
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          defaultMonthId={monthId}
        />
      )}

      <div className="mt-4 overflow-x-hidden">
        {!expenses || expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No expenses found.</p>
            <p className="text-sm mt-2">Add your first expense to get started!</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet: 2-column grid */}
            <div className="lg:hidden grid grid-cols-2 gap-2 sm:gap-3 w-full">
              {expenses?.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 space-y-2 min-w-0"
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {expense.expense_name}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getPeriodColor(expense.period),
                        color: isDarkColor(getPeriodColor(expense.period)) ? '#ffffff' : '#111827',
                      }}
                    >
                      {expense.period}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getCategoryColor(expense.category),
                        color: isDarkColor(getCategoryColor(expense.category))
                          ? '#ffffff'
                          : '#111827',
                      }}
                    >
                      {expense.category}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Budget:</span>
                    <span
                      className={
                        expense.budget === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white font-medium'
                      }
                    >
                      {formatCurrency(expense.budget)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                    <span
                      className={
                        expense.cost === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white font-medium'
                      }
                    >
                      {formatCurrency(expense.cost)}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    {getStatusBadge(expense.budget, expense.cost)}
                  </div>
                  {((expense.purchases && expense.purchases.length > 0) || expense.notes) && (
                    <button
                      onClick={() => togglePurchases(expense.id)}
                      className="w-full text-xs text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 underline"
                    >
                      {expense.purchases && expense.purchases.length > 0
                        ? `${expense.purchases.length} ${
                            expense.purchases.length === 1 ? 'purchase' : 'purchases'
                          }`
                        : 'Details'}
                    </button>
                  )}
                  {((expense.purchases && expense.purchases.length > 0) || expense.notes) &&
                    expandedPurchases.has(expense.id) && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {expense.purchases && expense.purchases.length > 0 && (
                          <div>
                            <div className="font-medium mb-1">Purchases:</div>
                            <div className="space-y-1">
                              {expense.purchases.map((purchase, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded"
                                >
                                  <span className="text-gray-700 dark:text-gray-300 truncate">
                                    {purchase.name}
                                  </span>
                                  <span
                                    className={`font-medium ml-2 ${
                                      purchase.amount === 0
                                        ? 'text-gray-400 dark:text-gray-500'
                                        : 'text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    {formatCurrency(purchase.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {expense.notes && (
                          <div>
                            <div className="font-medium mb-1">Notes:</div>
                            <div className="bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded">
                              <span className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                {expense.notes}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="flex-1 text-xs px-2 py-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 border border-primary-300 dark:border-primary-700 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="flex-1 text-xs px-2 py-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block overflow-hidden">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">
                      Expense
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/12">
                      Period
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/8">
                      Category
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/12">
                      Budget
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/12">
                      Cost
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/8">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/12">
                      Details
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/8">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {expenses?.map((expense) => (
                    <React.Fragment key={expense.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-white truncate">
                          {expense.expense_name}
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap truncate">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getPeriodColor(expense.period),
                              color: isDarkColor(getPeriodColor(expense.period))
                                ? '#ffffff'
                                : '#111827',
                            }}
                          >
                            {expense.period}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: getCategoryColor(expense.category),
                              color: isDarkColor(getCategoryColor(expense.category))
                                ? '#ffffff'
                                : '#111827',
                            }}
                          >
                            {expense.category}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-right ${
                            expense.budget === 0
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {formatCurrency(expense.budget)}
                        </td>
                        <td
                          className={`px-3 py-4 text-sm text-right ${
                            expense.cost === 0
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {formatCurrency(expense.cost)}
                        </td>
                        <td className="px-3 py-4 text-sm">
                          {getStatusBadge(expense.budget, expense.cost)}
                        </td>
                        <td className="px-3 py-4 text-sm font-medium">
                          {(expense.purchases && expense.purchases.length > 0) || expense.notes ? (
                            <button
                              onClick={() => togglePurchases(expense.id)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 underline cursor-pointer"
                            >
                              {expense.purchases && expense.purchases.length > 0
                                ? `${expense.purchases.length} ${
                                    expense.purchases.length === 1 ? 'purchase' : 'purchases'
                                  }`
                                : 'Details'}
                            </button>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-sm font-medium text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setEditingExpense(expense)}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {((expense.purchases && expense.purchases.length > 0) || expense.notes) &&
                        expandedPurchases.has(expense.id) && (
                          <tr className="bg-gray-50 dark:bg-gray-900/30">
                            <td colSpan={8} className="px-3 py-3">
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
                                {expense.purchases && expense.purchases.length > 0 && (
                                  <div>
                                    <div className="font-medium mb-1">Purchases:</div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                      {expense.purchases.map((purchase, idx) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between items-center bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
                                        >
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {purchase.name}
                                          </span>
                                          <span
                                            className={`font-medium ml-2 ${
                                              purchase.amount === 0
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-900 dark:text-white'
                                            }`}
                                          >
                                            {formatCurrency(purchase.amount)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {expense.notes && (
                                  <div>
                                    <div className="font-medium mb-1">Notes:</div>
                                    <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                                      <span className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {expense.notes}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
