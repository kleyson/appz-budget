import {
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useBackupDownloadUrl,
} from '../hooks/useReports';
import { useAuth } from '../contexts/AuthContext';

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const Backup = () => {
  const { user } = useAuth();

  // Backup hooks
  const { data: backupsData, isLoading: backupsLoading } = useBackups();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const getDownloadUrl = useBackupDownloadUrl();

  const handleDownload = async (filename: string) => {
    try {
      const result = await getDownloadUrl.mutateAsync(filename);
      // Open the signed URL in a new tab to trigger download
      window.open(result.download_url, '_blank');
    } catch {
      console.error('Failed to get download URL');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await createBackup.mutateAsync();
    } catch {
      console.error('Failed to create backup');
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        await deleteBackup.mutateAsync(filename);
      } catch {
        console.error('Failed to delete backup');
      }
    }
  };

  // Only admin users can access backups
  if (!user?.is_admin) {
    return (
      <div className="mx-2 sm:mx-4 my-4">
        <div className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            You don't have permission to access this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-2 sm:mx-4 my-4 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Database Backups
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Automatic daily backups at 2 AM. Download or create manual backups.
        </p>
      </div>

      {/* Backup Section */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Backups
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your database backups</p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={createBackup.isPending}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            {createBackup.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Backup
              </>
            )}
          </button>
        </div>

        {backupsLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading backups...
          </div>
        ) : backupsData?.backups && backupsData.backups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Filename
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Size
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {backupsData.backups.map((backup) => (
                  <tr
                    key={backup.filename}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                      {backup.filename}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {formatFileSize(backup.size)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(backup.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(backup.filename)}
                          disabled={getDownloadUrl.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
                          title="Download backup"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.filename)}
                          disabled={deleteBackup.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Delete backup"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No backups available. Create your first backup using the button above.
          </div>
        )}
      </div>
    </div>
  );
};
