import { useState, FormEvent, ChangeEvent } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import type { User, UserRegister } from '../types';
import { AxiosError } from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';

interface UserCreate extends UserRegister {
  is_active?: boolean;
  is_admin?: boolean;
}

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<UserCreate>({
    email: '',
    password: '',
    full_name: '',
    is_active: true,
    is_admin: false,
  });
  const [error, setError] = useState('');

  const { data: users, isLoading } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const { showConfirm, showAlert } = useDialog();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate password for new users
    if (!editingUser && (!formData.password || formData.password.length < 8)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      if (editingUser) {
        // Update user (password is optional for updates)
        const updateData: Partial<User> & { is_active?: boolean; is_admin?: boolean } = {
          email: formData.email,
          full_name: formData.full_name || null,
          is_active: formData.is_active,
          is_admin: formData.is_admin,
        };
        await updateMutation.mutateAsync({ id: editingUser.id, data: updateData });
      } else {
        // Create new user
        await createMutation.mutateAsync(formData);
      }
      setFormData({ email: '', password: '', full_name: '', is_active: true });
      setEditingUser(null);
      setShowForm(false);
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      setError(error.response?.data?.detail || 'An error occurred');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't pre-fill password
      full_name: user.full_name || '',
      is_active: user.is_active,
      is_admin: user.is_admin,
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: number, email: string) => {
    const confirmed = await showConfirm({
      title: 'Delete User',
      message: `Are you sure you want to delete the user "${email}"?`,
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
          message: error.response?.data?.detail || 'Cannot delete user',
          type: 'error',
        });
      }
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        data: { is_active: !user.is_active },
      });
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>;
      await showAlert({
        title: 'Error',
        message: error.response?.data?.detail || 'Cannot update user',
        type: 'error',
      });
    }
  };

  const handleCancel = () => {
    setFormData({ email: '', password: '', full_name: '', is_active: true, is_admin: false });
    setEditingUser(null);
    setShowForm(false);
    setError('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="mx-2 sm:mx-4 my-4 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Users</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingUser(null);
            setFormData({ email: '', password: '', full_name: '', is_active: true });
          }}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm sm:text-base rounded-lg font-medium transition-colors shadow-sm"
        >
          <span className="hidden sm:inline">+ Add User</span>
          <span className="sm:hidden">+ Add</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@example.com"
                required
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Minimum 8 characters"
                  required={!editingUser}
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name (optional)
              </label>
              <input
                type="text"
                value={formData.full_name || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Active
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={formData.is_admin}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, is_admin: e.target.checked })
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_admin"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Admin
                </label>
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
                  : editingUser
                    ? 'Update'
                    : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-4 overflow-x-hidden">
        {!users || users.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No users found.</p>
            <p className="text-sm mt-2">Add your first user to get started!</p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet: 2-column grid */}
            <div className="lg:hidden grid grid-cols-2 gap-2 sm:gap-3 w-full">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 space-y-2 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.email}
                    </span>
                    {user.id === currentUser?.id && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        (You)
                      </span>
                    )}
                  </div>
                  {user.full_name && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {user.full_name}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }
                        hover:opacity-80 transition-opacity
                      `}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                    {user.is_admin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 text-xs px-2 py-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 border border-primary-300 dark:border-primary-700 rounded"
                    >
                      Edit
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="flex-1 text-xs px-2 py-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {user.email}
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            (You)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.full_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              user.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }
                            hover:opacity-80 transition-opacity
                          `}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.is_admin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            Admin
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                        >
                          Edit
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(user.id, user.email)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
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
