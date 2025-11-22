import { useState } from 'react';
import { useCreateExpense, useUpdateExpense } from '../hooks/useExpenses';
import { useCategories } from '../hooks/useCategories';
import { usePeriods } from '../hooks/usePeriods';

export const ExpenseForm = ({ expense = null, onClose }) => {
  const [formData, setFormData] = useState({
    expense_name: expense?.expense_name || '',
    period: expense?.period || '',
    category: expense?.category || '',
    budget: expense?.budget || 0,
    cost: expense?.cost || 0,
    notes: expense?.notes || '',
  });

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const { data: categories } = useCategories();
  const { data: periods } = usePeriods();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (expense) {
        await updateMutation.mutateAsync({ id: expense.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' || name === 'cost' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{expense ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Expense Name</label>
            <input
              type="text"
              name="expense_name"
              value={formData.expense_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Period</label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              required
            >
              <option value="">Select Period</option>
              {periods?.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Budget</label>
              <input
                type="number"
                step="0.01"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Cost</label>
              <input
                type="number"
                step="0.01"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {expense ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
