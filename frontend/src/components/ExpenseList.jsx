import { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { useDeleteExpense } from '../hooks/useExpenses';
import { ExpenseForm } from './ExpenseForm';

export const ExpenseList = ({ periodFilter = null, categoryFilter = null }) => {
  const [editingExpense, setEditingExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { data: expenses, isLoading } = useExpenses({
    period: periodFilter,
    category: categoryFilter,
  });
  const deleteMutation = useDeleteExpense();

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const getStatusIcon = (budget, cost) => {
    return budget >= cost ? '✅' : '🔴';
  };

  if (isLoading) {
    return <div className="loading">Loading expenses...</div>;
  }

  return (
    <div className="expense-list">
      <div className="list-header">
        <h2>Expenses</h2>
        <button onClick={() => setShowForm(true)}>+ Add Expense</button>
      </div>

      {showForm && (
        <ExpenseForm onClose={() => setShowForm(false)} />
      )}

      {editingExpense && (
        <ExpenseForm expense={editingExpense} onClose={() => setEditingExpense(null)} />
      )}

      <table>
        <thead>
          <tr>
            <th>Expense</th>
            <th>Period</th>
            <th>Category</th>
            <th>Budget</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses?.map(expense => (
            <tr key={expense.id}>
              <td>{expense.expense_name}</td>
              <td>{expense.period}</td>
              <td>{expense.category}</td>
              <td>${expense.budget.toFixed(2)}</td>
              <td>${expense.cost.toFixed(2)}</td>
              <td>{getStatusIcon(expense.budget, expense.cost)}</td>
              <td>{expense.notes || '-'}</td>
              <td>
                <button onClick={() => setEditingExpense(expense)}>Edit</button>
                <button onClick={() => handleDelete(expense.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!expenses || expenses.length === 0 && (
        <p className="empty-state">No expenses found. Add your first expense!</p>
      )}
    </div>
  );
};
