import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';

export const CategoryManagement = () => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState('');

  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setFormData({ name: '' });
      setEditingCategory(null);
      setShowForm(false);
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        alert(error.response?.data?.detail || 'Cannot delete category');
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '' });
    setEditingCategory(null);
    setShowForm(false);
    setError('');
  };

  if (isLoading) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="category-management">
      <div className="list-header">
        <h2>Categories</h2>
        <button onClick={() => { setShowForm(true); setEditingCategory(null); setFormData({ name: '' }); }}>
          + Add Category
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="e.g., Groceries"
                required
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button type="button" onClick={handleCancel}>Cancel</button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories && categories.length > 0 ? (
            categories.map(category => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>
                  <button onClick={() => handleEdit(category)}>Edit</button>
                  <button onClick={() => handleDelete(category.id, category.name)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="empty-state">
                No categories found. Add your first category!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
