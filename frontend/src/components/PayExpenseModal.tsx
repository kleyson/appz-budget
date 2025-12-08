import { useState, useEffect } from 'react';
import { Modal, Button } from './shared';
import { CurrencyInput } from './CurrencyInput';
import { formatCurrency } from '../utils/format';
import type { Expense } from '../types';

interface PayExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  isLoading?: boolean;
}

export const PayExpenseModal = ({
  expense,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: PayExpenseModalProps) => {
  const [amount, setAmount] = useState(0);

  // Reset amount to budget when expense changes or modal opens
  useEffect(() => {
    if (expense && isOpen) {
      setAmount(expense.budget);
    }
  }, [expense, isOpen]);

  const handleConfirm = () => {
    onConfirm(amount);
  };

  if (!expense) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pay Expense"
      icon={<PayIcon />}
      iconBgClass="bg-green-500/10 dark:bg-green-500/15 text-green-600 dark:text-green-400"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading || amount <= 0}
            className="!bg-green-600 hover:!bg-green-700 dark:!bg-green-600 dark:hover:!bg-green-700"
          >
            {isLoading ? 'Processing...' : 'Pay'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-400">
          Add a payment to "
          <span className="font-medium text-slate-900 dark:text-white">{expense.expense_name}</span>
          "
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Payment Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
              $
            </span>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              className="w-full pl-7 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-500 dark:focus:border-green-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
              placeholder="0.00"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Budgeted: {formatCurrency(expense.budget)}
          </p>
        </div>
      </div>
    </Modal>
  );
};

const PayIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);
