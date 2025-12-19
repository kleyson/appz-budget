import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import {
  useIncomeTypes,
  useCreateIncomeType,
  useUpdateIncomeType,
  useDeleteIncomeType,
} from '../hooks/useIncomeTypes';
import type { IncomeType, IncomeTypeCreate } from '../types';
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

export const IncomeTypeManagement = () => {
  const [editingIncomeType, setEditingIncomeType] = useState<IncomeType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<IncomeTypeCreate>({
    name: '',
    color: generateRandomColor(),
  });
  const [error, setError] = useState('');

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
    return <LoadingState text="Loading income types..." />;
  }

  return (
    <div className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <SectionTitle>Income Types</SectionTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {incomeTypes?.length || 0} {incomeTypes?.length === 1 ? 'type' : 'types'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setShowForm(true);
            setEditingIncomeType(null);
            setFormData({ name: '', color: generateRandomColor() });
          }}
          icon={<PlusIcon />}
        >
          <span className="hidden sm:inline">Add Income Type</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 surface-subtle border border-slate-200/80 dark:border-slate-700/50 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Income Type Name"
              value={formData.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Salary, Freelance"
              required
              autoFocus
            />
            <div className="form-group">
              <label className="input-label">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color || '#10b981'}
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
                  {formData.color || '#10b981'}
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
                  : editingIncomeType
                    ? 'Update'
                    : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-4">
        {!incomeTypes || incomeTypes.length === 0 ? (
          <EmptyState
            icon={<CashIcon />}
            title="No income types yet"
            description="Add your first income type to categorize your earnings."
          />
        ) : (
          <>
            {/* Mobile/Tablet: Cards */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incomeTypes.map((incomeType, index) => (
                <div
                  key={incomeType.id}
                  className="bg-white dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-4 card-hover animate-slide-up opacity-0"
                  style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-center justify-center mb-3">
                    <ColorChip color={incomeType.color}>{incomeType.name}</ColorChip>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="ghost"
                      onClick={() => handleEdit(incomeType)}
                      className="flex-1 text-sm border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(incomeType.id, incomeType.name)}
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
                    <th className="table-header-cell">Income Type</th>
                    <th className="table-header-cell">Color</th>
                    <th className="table-header-cell text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/50">
                  {incomeTypes.map((incomeType) => (
                    <tr key={incomeType.id} className="table-row group">
                      <td className="table-cell">
                        <ColorChip color={incomeType.color}>{incomeType.name}</ColorChip>
                      </td>
                      <td className="table-cell font-mono text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border border-slate-200 dark:border-slate-600"
                            style={{ backgroundColor: incomeType.color }}
                          />
                          {incomeType.color}
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconButton
                            variant="primary"
                            icon={<EditIcon />}
                            onClick={() => handleEdit(incomeType)}
                            title="Edit"
                          />
                          <IconButton
                            variant="danger"
                            icon={<TrashIcon />}
                            onClick={() => handleDelete(incomeType.id, incomeType.name)}
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

const CashIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
