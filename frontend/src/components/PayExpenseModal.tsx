import { useState, useEffect } from 'react';
import { Modal, Button, PlusIcon, WalletIcon } from './shared';
import { CurrencyInput } from './CurrencyInput';
import { formatCurrency } from '../utils/format';
import type { Expense } from '../types';

interface PayExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, purchaseName: string) => void;
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
  const [purchaseName, setPurchaseName] = useState('');

  const hasPurchases = expense?.purchases && expense.purchases.length > 0;
  const isAddingPurchase = hasPurchases;

  // Reset form when expense changes or modal opens
  useEffect(() => {
    if (expense && isOpen) {
      setAmount(isAddingPurchase ? 0 : expense.budget);
      setPurchaseName('');
    }
  }, [expense, isOpen, isAddingPurchase]);

  const handleConfirm = () => {
    onConfirm(amount, purchaseName || 'Payment');
  };

  if (!expense) return null;

  // Calculate current total from existing purchases
  const currentTotal = expense.purchases?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingBudget = expense.budget - currentTotal;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAddingPurchase ? 'Add Purchase' : 'Pay Expense'}
      icon={isAddingPurchase ? <PlusIcon /> : <WalletIcon />}
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
            {isLoading ? 'Processing...' : isAddingPurchase ? 'Add' : 'Pay'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-400">
          {isAddingPurchase ? 'Add a purchase to "' : 'Add a payment to "'}
          <span className="font-medium text-slate-900 dark:text-white">{expense.expense_name}</span>
          "
        </p>

        {isAddingPurchase && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Purchase Name
            </label>
            <input
              type="text"
              value={purchaseName}
              onChange={(e) => setPurchaseName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-500 dark:focus:border-green-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
              placeholder="e.g., Groceries, Gas, etc."
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {isAddingPurchase ? 'Purchase Amount' : 'Payment Amount'}
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
          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            <p>Budgeted: {formatCurrency(expense.budget)}</p>
            {isAddingPurchase && (
              <>
                <p>Current total: {formatCurrency(currentTotal)}</p>
                <p className={remainingBudget < 0 ? 'text-red-500' : ''}>
                  Remaining: {formatCurrency(remainingBudget)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
