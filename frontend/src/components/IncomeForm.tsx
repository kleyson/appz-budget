import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useCreateIncome, useUpdateIncome } from '../hooks/useIncomes';
import { usePeriods } from '../hooks/usePeriods';
import { useIncomeTypes } from '../hooks/useIncomeTypes';
import { useMonths, useCurrentMonth } from '../hooks/useMonths';
import type { Income, IncomeCreate } from '../types';
import { ColorSelect } from './ColorSelect';
import { MonthSelect } from './MonthSelect';

interface IncomeFormProps {
  income?: Income | null;
  onClose: () => void;
  defaultMonthId?: number | null;
}

export const IncomeForm = ({ income = null, onClose, defaultMonthId = null }: IncomeFormProps) => {
  const { data: months } = useMonths();
  const { data: currentMonth } = useCurrentMonth();

  const defaultMonth = defaultMonthId || income?.month_id || currentMonth?.id || null;

  const [formData, setFormData] = useState<IncomeCreate>({
    income_type_id: 0,
    period: '',
    budget: 0,
    amount: 0,
    month_id: income?.month_id || defaultMonth || 0,
  });

  // Update month_id if defaultMonth changes
  useEffect(() => {
    if (income) {
      setFormData({
        income_type_id: income.income_type_id,
        period: income.period,
        budget: income.budget,
        amount: income.amount,
        month_id: income.month_id,
      });
    } else if (defaultMonth && formData.month_id === 0) {
      setFormData((prev) => ({ ...prev, month_id: defaultMonth }));
    }
  }, [defaultMonth, income]);

  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();
  const { data: periods } = usePeriods();
  const { data: incomeTypes } = useIncomeTypes();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (income) {
        await updateMutation.mutateAsync({ id: income.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' || name === 'budget' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {income ? 'Edit Income' : 'Add Income'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ColorSelect
              options={
                incomeTypes?.map((it) => ({ id: it.id, name: it.name, color: it.color })) || []
              }
              value={incomeTypes?.find((it) => it.id === formData.income_type_id)?.name || ''}
              onChange={(value) => {
                const selectedType = incomeTypes?.find((it) => it.name === value);
                if (selectedType) {
                  setFormData((prev) => ({ ...prev, income_type_id: selectedType.id }));
                }
              }}
              placeholder="Select Income Type"
              label="Income Type"
              required
            />

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
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : income
                    ? 'Update Income'
                    : 'Create Income'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
