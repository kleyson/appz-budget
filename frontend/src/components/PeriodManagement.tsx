import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { usePeriods, useCreatePeriod, useUpdatePeriod, useDeletePeriod } from '../hooks/usePeriods';
import type { Period, PeriodCreate } from '../types';
import { AxiosError } from 'axios';
import { generateRandomColor } from '../utils/colors';
import { useDialog } from '../contexts/DialogContext';
import {
  Button,
  IconButton,
  LoadingState,
  EmptyState,
  ColorChip,
  FormInput,
  SectionTitle,
} from './shared';

export const PeriodManagement = () => {
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PeriodCreate>({
    name: '',
    color: generateRandomColor(),
  });
  const [error, setError] = useState('');

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
    return <LoadingState text="Loading periods..." />;
  }

  return (
    <div className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <SectionTitle>Periods</SectionTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {periods?.length || 0} {periods?.length === 1 ? 'period' : 'periods'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setShowForm(true);
            setEditingPeriod(null);
            setFormData({ name: '', color: generateRandomColor() });
          }}
          icon={<PlusIcon />}
        >
          <span className="hidden sm:inline">Add Period</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 surface-subtle border border-slate-200/80 dark:border-slate-700/50 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Period Name"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Fixed/1st Period"
              required
              autoFocus
            />
            <div className="form-group">
              <label className="input-label">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color || '#14b8a6'}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10 w-20 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setFormData({ ...formData, color: generateRandomColor() })}
                >
                  Random
                </Button>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                  {formData.color || '#14b8a6'}
                </span>
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingPeriod
                    ? 'Update'
                    : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-4">
        {!periods || periods.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon />}
            title="No periods yet"
            description="Add your first period to organize expenses by time."
          />
        ) : (
          <>
            {/* Mobile/Tablet: Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {periods.map((period, index) => (
                <div
                  key={period.id}
                  className="bg-white dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-4 card-hover animate-slide-up opacity-0"
                  style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <ColorChip color={period.color}>{period.name}</ColorChip>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="ghost"
                      onClick={() => handleEdit(period)}
                      className="flex-1 text-sm border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(period.id, period.name)}
                      className="flex-1 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block rounded-xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Period</th>
                    <th className="table-header-cell">Color</th>
                    <th className="table-header-cell text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/50">
                  {periods.map((period) => (
                    <tr key={period.id} className="table-row group">
                      <td className="table-cell">
                        <ColorChip color={period.color}>{period.name}</ColorChip>
                      </td>
                      <td className="table-cell font-mono text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-slate-200 dark:border-slate-600"
                            style={{ backgroundColor: period.color }}
                          />
                          {period.color}
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconButton
                            variant="primary"
                            icon={<EditIcon />}
                            onClick={() => handleEdit(period)}
                            title="Edit"
                          />
                          <IconButton
                            variant="danger"
                            icon={<TrashIcon />}
                            onClick={() => handleDelete(period.id, period.name)}
                            title="Delete"
                          />
                        </div>
                      </td>
                    </tr>
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

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
