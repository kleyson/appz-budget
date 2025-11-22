import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import {
  useIncomeTypes,
  useCreateIncomeType,
  useUpdateIncomeType,
  useDeleteIncomeType,
} from '../hooks/useIncomeTypes';
import type { IncomeType, IncomeTypeCreate } from '../types';
import { AxiosError } from 'axios';
import { generateRandomColor, isDarkColor } from '../utils/colors';
import { useDialog } from '../contexts/DialogContext';

export const IncomeTypeManagement = () => {
  const [editingIncomeType, setEditingIncomeType] = useState<IncomeType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<IncomeTypeCreate>({
    name: '',
    color: generateRandomColor(),
  });
  const [error, setError] = useState('');

  // Generate new random color when form opens for new income type
  useEffect(() => {
    if (showForm && !editingIncomeType) {
      setFormData((prev) => ({ ...prev, color: generateRandomColor() }));
    }
  }, [showForm, editingIncomeType]);

  const { data: incomeTypes, isLoading } = useIncomeTypes();
  const createMutation = useCreateIncomeType();
  const updateMutation = useUpdateIncomeType();
  const deleteMutation = useDeleteIncomeType();
  const { showConfirm, showAlert } = useDialog();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      if (editingIncomeType) {
        await updateMutation.mutateAsync({ id: editingIncomeType.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setFormData({ name: '', color: generateRandomColor() });
      setEditingIncomeType(null);
      setShowForm(false);
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'An error occurred');
    }
  };

  const handleEdit = (incomeType: IncomeType) => {
    setEditingIncomeType(incomeType);
    setFormData({ name: incomeType.name, color: incomeType.color });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Income Type',
      message: `Are you sure you want to delete the income type "${name}"?`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        const error = err as AxiosError<{ detail: string }>;
        await showAlert({
          title: 'Error',
          message: error.response?.data?.detail || 'Cannot delete income type',
          type: 'error',
        });
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', color: generateRandomColor() });
    setEditingIncomeType(null);
    setShowForm(false);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading income types...</div>
      </div>
    );
  }

  return (
    <div className="mx-4 my-4">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Income Types</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingIncomeType(null);
            setFormData({ name: '', color: generateRandomColor() });
          }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          + Add Income Type
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Income Type Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Salary, Freelance"
                required
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color || '#10b981'}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, color: generateRandomColor() })}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Random
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.color || '#10b981'}
                </span>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingIncomeType
                    ? 'Update'
                    : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        {!incomeTypes || incomeTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No income types found.</p>
            <p className="text-sm mt-2">Add your first income type to get started!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Income Type Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {incomeTypes.map((incomeType) => (
                <tr
                  key={incomeType.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: incomeType.color,
                        color: isDarkColor(incomeType.color) ? '#ffffff' : '#111827',
                      }}
                    >
                      {incomeType.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(incomeType)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(incomeType.id, incomeType.name)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
