import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useExpenses,
  useDeleteExpense,
  useReorderExpenses,
  usePayExpense,
} from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { usePeriods } from '../hooks/usePeriods';
import { useMonth } from '../hooks/useMonths';
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

interface SortableExpenseRowProps {
  expense: Expense;
  getCategoryColor: (categoryName: string) => string;
  getPeriodColor: (periodName: string) => string;
  getStatusBadge: (budget: number, cost: number) => React.ReactNode;
  formatCurrency: (amount: number) => string;
  isDarkColor: (color: string) => boolean;
  expandedPurchases: Set<number>;
  togglePurchases: (expenseId: number) => void;
  setEditingExpense: (expense: Expense) => void;
  handleDelete: (id: number) => void;
  handlePay: (expense: Expense) => void;
  isMonthClosed: boolean;
}

function SortableExpenseRow({
  expense,
  getCategoryColor,
  getPeriodColor,
  getStatusBadge,
  formatCurrency,
  isDarkColor,
  expandedPurchases,
  togglePurchases,
  setEditingExpense,
  handleDelete,
  handlePay,
  isMonthClosed,
}: SortableExpenseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: expense.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <React.Fragment>
      <tr
        ref={setNodeRef}
        style={style}
        className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
          isDragging ? 'bg-slate-100 dark:bg-slate-800' : ''
        }`}
      >
        <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              {...attributes}
              {...listeners}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
              </svg>
            </button>
            <span className="truncate">{expense.expense_name}</span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: getPeriodColor(expense.period),
              color: isDarkColor(getPeriodColor(expense.period)) ? '#ffffff' : '#111827',
            }}
          >
            {expense.period}
          </span>
        </td>
        <td className="px-4 py-4 text-sm">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: getCategoryColor(expense.category),
              color: isDarkColor(getCategoryColor(expense.category)) ? '#ffffff' : '#111827',
            }}
          >
            {expense.category}
          </span>
        </td>
        <td
          className={`px-4 py-4 text-sm text-right font-medium tabular-nums ${
            expense.budget === 0
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {formatCurrency(expense.budget)}
        </td>
        <td
          className={`px-4 py-4 text-sm text-right font-medium tabular-nums ${
            expense.cost === 0
              ? 'text-slate-400 dark:text-slate-500'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {formatCurrency(expense.cost)}
        </td>
        <td className="px-4 py-4 text-sm">{getStatusBadge(expense.budget, expense.cost)}</td>
        <td className="px-4 py-4 text-sm">
          {(expense.purchases && expense.purchases.length > 0) || expense.notes ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePurchases(expense.id);
              }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
            >
              {expense.purchases && expense.purchases.length > 0
                ? `${expense.purchases.length} ${expense.purchases.length === 1 ? 'purchase' : 'purchases'}`
                : 'Details'}
            </button>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          )}
        </td>
        <td className="px-4 py-4 text-sm text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePay(expense);
              }}
              disabled={isMonthClosed}
              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isMonthClosed ? 'Month is closed' : 'Pay expense'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingExpense(expense);
              }}
              disabled={isMonthClosed}
              className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isMonthClosed ? 'Month is closed' : 'Edit'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(expense.id);
              }}
              disabled={isMonthClosed}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isMonthClosed ? 'Month is closed' : 'Delete'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      {((expense.purchases && expense.purchases.length > 0) || expense.notes) &&
        expandedPurchases.has(expense.id) && (
          <tr className="bg-slate-50/50 dark:bg-slate-800/30">
            <td colSpan={8} className="px-4 py-4">
              <div className="text-sm space-y-4 ml-7">
                {expense.purchases && expense.purchases.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Purchases
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {expense.purchases.map((purchase, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <span className="text-slate-700 dark:text-slate-300 truncate">
                            {purchase.name}
                          </span>
                          <span
                            className={`font-medium ml-2 tabular-nums ${
                              purchase.amount === 0
                                ? 'text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
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
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Notes
                    </p>
                    <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {expense.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
    </React.Fragment>
  );
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
  const { data: currentMonthData } = useMonth(monthId || 0);
  const deleteMutation = useDeleteExpense();
  const reorderMutation = useReorderExpenses();
  const payMutation = usePayExpense();
  const { showConfirm, showAlert } = useDialog();

  const isMonthClosed = currentMonthData?.is_closed ?? false;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCategoryColor = (categoryName: string): string => {
    const category = categories?.find((c) => c.name === categoryName);
    return category?.color || '#5a6ff2';
  };

  const getPeriodColor = (periodName: string): string => {
    const period = periods?.find((p) => p.name === periodName);
    return period?.color || '#5a6ff2';
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

  const handlePay = async (expense: Expense) => {
    const confirmed = await showConfirm({
      title: 'Pay Expense',
      message: `Add a payment of ${formatCurrency(expense.budget)} to "${expense.expense_name}"?`,
      type: 'info',
      confirmText: 'Pay',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await payMutation.mutateAsync({ id: expense.id });
        await showAlert({
          title: 'Payment Added',
          message: `Payment of ${formatCurrency(expense.budget)} has been added to the expense.`,
          type: 'success',
        });
      } catch (error) {
        console.error('Error paying expense:', error);
        await showAlert({
          title: 'Error',
          message: 'Failed to pay expense. Please try again.',
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
      <span className={`badge ${isWithinBudget ? 'badge-success' : 'badge-danger'}`}>
        {isWithinBudget ? (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            On Budget
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Over Budget
          </span>
        )}
      </span>
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !expenses) {
      return;
    }

    const oldIndex = expenses.findIndex((exp) => exp.id === active.id);
    const newIndex = expenses.findIndex((exp) => exp.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedExpenses = arrayMove(expenses, oldIndex, newIndex);
    const expenseIds = reorderedExpenses.map((exp) => exp.id);

    try {
      await reorderMutation.mutateAsync({
        expenseIds,
        filters: {
          period: periodFilter,
          category: categoryFilter,
          month_id: monthId,
        },
      });
    } catch (error) {
      console.error('Error reordering expenses:', error);
      await showAlert({
        title: 'Error',
        message: 'Failed to reorder expenses. Please try again.',
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading expenses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Expenses
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {expenses?.length || 0} {expenses?.length === 1 ? 'expense' : 'expenses'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={isMonthClosed}
          className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={isMonthClosed ? 'Month is closed' : undefined}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
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

      <div className="mt-4">
        {!expenses || expenses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
              No expenses yet
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              Add your first expense to start tracking your budget.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet: Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {expenses?.map((expense, index) => (
                <div
                  key={expense.id}
                  className="bg-white dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-4 card-hover animate-slide-up opacity-0"
                  style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate pr-2">
                      {expense.expense_name}
                    </h4>
                    {getStatusBadge(expense.budget, expense.cost)}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                      style={{
                        backgroundColor: getPeriodColor(expense.period),
                        color: isDarkColor(getPeriodColor(expense.period)) ? '#ffffff' : '#111827',
                      }}
                    >
                      {expense.period}
                    </span>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
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
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Budget</p>
                      <p
                        className={`font-semibold tabular-nums ${
                          expense.budget === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(expense.budget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Actual</p>
                      <p
                        className={`font-semibold tabular-nums ${
                          expense.cost === 0
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(expense.cost)}
                      </p>
                    </div>
                  </div>
                  {((expense.purchases && expense.purchases.length > 0) || expense.notes) && (
                    <button
                      onClick={() => togglePurchases(expense.id)}
                      className="w-full text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium mb-3"
                    >
                      {expense.purchases && expense.purchases.length > 0
                        ? `${expense.purchases.length} ${expense.purchases.length === 1 ? 'purchase' : 'purchases'}`
                        : 'View details'}
                    </button>
                  )}
                  {((expense.purchases && expense.purchases.length > 0) || expense.notes) &&
                    expandedPurchases.has(expense.id) && (
                      <div className="text-xs space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700 mb-3">
                        {expense.purchases && expense.purchases.length > 0 && (
                          <div className="space-y-1">
                            {expense.purchases.map((purchase, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 px-2 py-1.5 rounded-lg"
                              >
                                <span className="text-slate-600 dark:text-slate-400 truncate">
                                  {purchase.name}
                                </span>
                                <span
                                  className={`font-medium ml-2 tabular-nums ${
                                    purchase.amount === 0
                                      ? 'text-slate-400'
                                      : 'text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {formatCurrency(purchase.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {expense.notes && (
                          <div className="bg-slate-50 dark:bg-slate-900/50 px-2 py-1.5 rounded-lg">
                            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                              {expense.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handlePay(expense)}
                      disabled={isMonthClosed}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pay
                    </button>
                    <button
                      onClick={() => setEditingExpense(expense)}
                      disabled={isMonthClosed}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={isMonthClosed}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-700/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Expense
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Actual
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={expenses?.map((exp) => exp.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/50">
                      {expenses?.map((expense) => (
                        <SortableExpenseRow
                          key={expense.id}
                          expense={expense}
                          getCategoryColor={getCategoryColor}
                          getPeriodColor={getPeriodColor}
                          getStatusBadge={getStatusBadge}
                          formatCurrency={formatCurrency}
                          isDarkColor={isDarkColor}
                          expandedPurchases={expandedPurchases}
                          togglePurchases={togglePurchases}
                          setEditingExpense={setEditingExpense}
                          handleDelete={handleDelete}
                          handlePay={handlePay}
                          isMonthClosed={isMonthClosed}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
