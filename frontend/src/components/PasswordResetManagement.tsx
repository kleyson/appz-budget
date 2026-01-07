import { useState, useEffect } from 'react';
import { authApi, usersApi } from '../api/client';
import { User } from '../types';

interface PasswordReset {
  user_email: string;
  short_code: string | null;
  created_at: string;
  expires_at: string;
  minutes_remaining: number;
}

export const PasswordResetManagement = () => {
  const [resets, setResets] = useState<PasswordReset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState<{
    url: string;
    code: string;
    email: string;
  } | null>(null);

  const fetchResets = async () => {
    try {
      const response = await authApi.getPasswordResets();
      setResets(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch password resets');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchResets(), fetchUsers()]);
      setIsLoading(false);
    };
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchResets();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleGenerateLink = async () => {
    if (!selectedUserId) return;

    setMessage('');
    setError('');
    setGeneratedLink(null);

    try {
      const response = await authApi.generateResetLink(selectedUserId);
      // Replace the hostname in the URL with the current browser hostname
      const backendUrl = response.data.reset_url;
      const urlPath = new URL(backendUrl).pathname + new URL(backendUrl).search;
      const frontendUrl = window.location.origin + urlPath;
      setGeneratedLink({
        url: frontendUrl,
        code: response.data.short_code,
        email: response.data.user_email,
      });
      setMessage(`Reset link generated for ${response.data.user_email}`);
      setSelectedUserId(null);
      // Refresh the list
      await fetchResets();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate reset link');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${label} copied to clipboard!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Active Password Reset Requests
        </h3>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {resets.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">No active password reset requests</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {resets.map((reset, index) => (
                <li
                  key={index}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                          {reset.user_email}
                        </p>
                        <div className="ml-2 flex-shrink-0">
                          {reset.minutes_remaining > 0 ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              {reset.minutes_remaining} min left
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                              Expired
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-mono font-bold text-lg text-indigo-600 dark:text-indigo-400">
                              {reset.short_code || 'N/A'}
                            </span>
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                          <p>Created: {formatDate(reset.created_at)}</p>
                        </div>
                      </div>
                    </div>
                    {reset.short_code && reset.minutes_remaining > 0 && (
                      <button
                        onClick={() => copyToClipboard(reset.short_code!, 'Code')}
                        className="ml-4 px-3 py-1 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                      >
                        Copy Code
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Generate Reset Link Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Generate Reset Link for User
        </h3>

        <div className="flex gap-4">
          <select
            value={selectedUserId || ''}
            onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email} {user.full_name ? `(${user.full_name})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateLink}
            disabled={!selectedUserId}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Link
          </button>
        </div>

        {generatedLink && (
          <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-2">
              Generated for {generatedLink.email}
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                  Reset Code (6 digits)
                </label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 rounded text-lg font-mono font-bold text-indigo-900 dark:text-indigo-200">
                    {generatedLink.code}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedLink.code, 'Code')}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                  Reset URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink.url}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-indigo-300 dark:border-indigo-600 rounded text-sm font-mono text-indigo-900 dark:text-indigo-200"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedLink.url, 'URL')}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
