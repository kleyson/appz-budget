import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { usePeriods, useCreatePeriod, useUpdatePeriod, useDeletePeriod } from '../hooks/usePeriods';
import type { Period, PeriodCreate } from '../types';
import { AxiosError } from 'axios';
import { generateRandomColor, isDarkColor } from '../utils/colors';
import { useDialog } from '../contexts/DialogContext';

export const PeriodManagement = () => {
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PeriodCreate>({
    name: '',
    color: generateRandomColor(),
  });
  const [error, setError] = useState('');

  // Generate new random color when form opens for new period
  useEffect(() => {
    if (showForm && !editingPeriod) {
      setFormData((prev) => ({ ...prev, color: generateRandomColor() }));
    }
  }, [showForm, editingPeriod]);

  const { data: periods, isLoading } = usePeriods();
  const createMutation = useCreatePeriod();
  const updateMutation = useUpdatePeriod();
  const deleteMutation = useDeletePeriod();
  const { showConfirm, showAlert } = useDialog();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      if (editingPeriod) {
        await updateMutation.mutateAsync({ id: editingPeriod.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setFormData({ name: '', color: generateRandomColor() });
      setEditingPeriod(null);
      setShowForm(false);
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'An error occurred');
    }
  };

  const handleEdit = (period: Period) => {
    setEditingPeriod(period);
    setFormData({ name: period.name, color: period.color });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Period',
      message: `Are you sure you want to delete the period "${name}"?`,
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
          message: error.response?.data?.detail || 'Cannot delete period',
          type: 'error',
        });
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', color: generateRandomColor() });
    setEditingPeriod(null);
    setShowForm(false);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading periods...</div>
      </div>
    );
  }

  return (
    <div className="mx-4 my-4">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Periods</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPeriod(null);
            setFormData({ name: '', color: generateRandomColor() });
          }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          + Add Period
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Fixed/1st Period"
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
                  value={formData.color || '#8b5cf6'}
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
                  {formData.color || '#8b5cf6'}
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
                  : editingPeriod
                    ? 'Update'
                    : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        {!periods || periods.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No periods found.</p>
            <p className="text-sm mt-2">Add your first period to get started!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Period Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {periods.map((period) => (
                <tr
                  key={period.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: period.color,
                        color: isDarkColor(period.color) ? '#ffffff' : '#111827',
                      }}
                    >
                      {period.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(period)}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(period.id, period.name)}
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
