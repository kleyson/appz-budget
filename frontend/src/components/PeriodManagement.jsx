import { useState } from 'react';
import { usePeriods, useCreatePeriod, useUpdatePeriod, useDeletePeriod } from '../hooks/usePeriods';

export const PeriodManagement = () => {
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState('');

  const { data: periods, isLoading } = usePeriods();
  const createMutation = useCreatePeriod();
  const updateMutation = useUpdatePeriod();
  const deleteMutation = useDeletePeriod();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (editingPeriod) {
        await updateMutation.mutateAsync({ id: editingPeriod.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setFormData({ name: '' });
      setEditingPeriod(null);
      setShowForm(false);
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred');
    }
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    setFormData({ name: period.name });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the period "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        alert(error.response?.data?.detail || 'Cannot delete period');
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '' });
    setEditingPeriod(null);
    setShowForm(false);
    setError('');
  };

  if (isLoading) {
    return <div className="loading">Loading periods...</div>;
  }

  return (
    <div className="period-management">
      <div className="list-header">
        <h2>Periods</h2>
        <button onClick={() => { setShowForm(true); setEditingPeriod(null); setFormData({ name: '' }); }}>
          + Add Period
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Period Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="e.g., Fixed/1st Period"
                required
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button type="button" onClick={handleCancel}>Cancel</button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPeriod ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Period Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {periods && periods.length > 0 ? (
            periods.map(period => (
              <tr key={period.id}>
                <td>{period.name}</td>
                <td>
                  <button onClick={() => handleEdit(period)}>Edit</button>
                  <button onClick={() => handleDelete(period.id, period.name)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="empty-state">
                No periods found. Add your first period!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
