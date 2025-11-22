import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useCreateExpense, useUpdateExpense } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { usePeriods } from '../hooks/usePeriods';
import { useMonths, useCurrentMonth } from '../hooks/useMonths';
import type { Expense, ExpenseCreate } from '../types';
import { ColorSelect } from './ColorSelect';
import { MonthSelect } from './MonthSelect';

interface ExpenseFormProps {
  expense?: Expense | null;
  onClose: () => void;
  defaultMonthId?: number | null;
}

export const ExpenseForm = ({
  expense = null,
  onClose,
  defaultMonthId = null,
}: ExpenseFormProps) => {
  const { data: months } = useMonths();
  const { data: currentMonth } = useCurrentMonth();

  const defaultMonth = defaultMonthId || expense?.month_id || currentMonth?.id || null;

  const [formData, setFormData] = useState<ExpenseCreate>({
    expense_name: expense?.expense_name || '',
    period: expense?.period || '',
    category: expense?.category || '',
    budget: expense?.budget || 0,
    cost: expense?.cost || 0,
    notes: expense?.notes || '',
    month_id: expense?.month_id || defaultMonth || 0,
    purchases: expense?.purchases || [],
  });

  // Check if any purchases exist in the array (even if empty)
  const purchases = formData.purchases || [];
  const hasPurchases = purchases.length > 0;

  // Calculate cost from purchases if they exist
  const calculatedCost = hasPurchases
    ? purchases.reduce((sum, item) => sum + (item.amount || 0), 0)
    : formData.cost;

  // Update cost when purchases change (only when purchases exist)
  useEffect(() => {
    if (hasPurchases) {
      const total = purchases.reduce((sum, item) => sum + (item.amount || 0), 0);
      setFormData((prev) => ({ ...prev, cost: total }));
    }
  }, [purchases, hasPurchases]);

  // Update month_id if defaultMonth changes
  useEffect(() => {
    if (!expense && defaultMonth && formData.month_id === 0) {
      setFormData((prev) => ({ ...prev, month_id: defaultMonth }));
    }
  }, [defaultMonth, expense]);

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const { data: categories } = useCategories();
  const { data: periods } = usePeriods();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Prepare data for submission - include purchases only if they exist and have values
      const submitData = {
        ...formData,
        purchases:
          formData.purchases && formData.purchases.length > 0
            ? formData.purchases.filter((item) => item.name.trim() !== '' || item.amount > 0)
            : null,
        // Cost is already calculated from purchases in the formData
      };

      if (expense) {
        await updateMutation.mutateAsync({ id: expense.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'budget' || name === 'cost' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleAddPurchase = () => {
    setFormData((prev) => ({
      ...prev,
      purchases: [...(prev.purchases || []), { name: '', amount: 0 }],
    }));
  };

  const handleRemovePurchase = (index: number) => {
    setFormData((prev) => {
      const newPurchases = prev.purchases?.filter((_, i) => i !== index) || [];
      // If removing the last purchase, keep the current cost value
      // The cost field will become editable again
      return {
        ...prev,
        purchases: newPurchases,
      };
    });
  };

  const handlePurchaseChange = (
    index: number,
    field: 'name' | 'amount',
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      purchases:
        prev.purchases?.map((item, i) =>
          i === index
            ? {
                ...item,
                [field]:
                  field === 'amount'
                    ? typeof value === 'string'
                      ? parseFloat(value) || 0
                      : value
                    : value,
              }
            : item
        ) || [],
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expense Name
            </label>
            <input
              type="text"
              name="expense_name"
              value={formData.expense_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <MonthSelect
            months={months}
            value={formData.month_id || null}
            onChange={(monthId) => setFormData((prev) => ({ ...prev, month_id: monthId }))}
            placeholder="Select Month"
            label="Month"
            required
          />

          <ColorSelect
            options={periods?.map((p) => ({ id: p.id, name: p.name, color: p.color })) || []}
            value={formData.period}
            onChange={(value) => setFormData((prev) => ({ ...prev, period: value }))}
            placeholder="Select Period"
            label="Period"
            required
          />

          <ColorSelect
            options={categories?.map((c) => ({ id: c.id, name: c.name, color: c.color })) || []}
            value={formData.category}
            onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            placeholder="Select Category"
            label="Category"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget
              </label>
              <input
                type="number"
                step="0.01"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost{' '}
                {hasPurchases && (
                  <span className="text-xs text-gray-500">(calculated from purchases)</span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                name="cost"
                value={hasPurchases ? calculatedCost : formData.cost}
                onChange={handleChange}
                required
                disabled={hasPurchases}
                readOnly={hasPurchases}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Purchases Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Purchases
              </label>
              <button
                type="button"
                onClick={handleAddPurchase}
                className="text-sm px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                + Add Purchase
              </button>
            </div>

            {hasPurchases ? (
              <div className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
                {purchases.map((purchase, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Purchase name"
                      value={purchase.name}
                      onChange={(e) => handlePurchaseChange(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={purchase.amount}
                      onChange={(e) => handlePurchaseChange(index, 'amount', e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePurchase(index)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Remove purchase"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                <div
                  className={`text-xs pt-2 border-t border-gray-200 dark:border-gray-700 ${
                    calculatedCost === 0
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Total: ${calculatedCost.toFixed(2)}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No purchases. Add purchases to automatically calculate cost, or enter cost manually.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : expense
                  ? 'Update'
                  : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
