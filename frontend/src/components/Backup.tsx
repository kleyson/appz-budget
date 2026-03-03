import { useRef } from 'react';
import {
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useDownloadBackup,
  useRestoreBackup,
  useUploadRestore,
} from '../hooks/useReports';
import { useAuth } from '../contexts/AuthContext';

// Format file size
const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const Backup = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup hooks
  const { data: backupsData, isLoading: backupsLoading } = useBackups();
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const downloadBackup = useDownloadBackup();
  const restoreBackup = useRestoreBackup();
  const uploadRestore = useUploadRestore();

  const handleDownload = async (filename: string) => {
    try {
      await downloadBackup.mutateAsync(filename);
    } catch {
      console.error('Failed to download backup');
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

  const handleRestoreBackup = async (filename: string) => {
    if (
      window.confirm(
        `Are you sure you want to restore from ${filename}?\n\nThis will replace the current database with the backup. This action cannot be undone.`
      )
    ) {
      try {
        await restoreBackup.mutateAsync(filename);
        window.alert('Database restored successfully. The page will reload.');
        window.location.reload();
      } catch {
        console.error('Failed to restore backup');
      }
    }
  };

  const handleUploadRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file.name.endsWith('.db')) {
      window.alert('Please select a .db SQLite database file.');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to restore from "${file.name}"?\n\nThis will replace the current database with the uploaded file. This action cannot be undone.`
      )
    ) {
      try {
        await uploadRestore.mutateAsync(file);
        window.alert('Database restored successfully. The page will reload.');
        window.location.reload();
      } catch {
        console.error('Failed to restore from uploaded file');
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
                          disabled={downloadBackup.isPending}
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
                          onClick={() => handleRestoreBackup(backup.filename)}
                          disabled={restoreBackup.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
                          title="Restore from this backup"
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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

      {/* Restore from file */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Restore from File</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a previously downloaded .db backup file to restore the database.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".db"
            onChange={handleUploadRestore}
            disabled={uploadRestore.isPending}
            className="hidden"
            id="backup-upload"
          />
          <label
            htmlFor="backup-upload"
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer
              ${
                uploadRestore.isPending
                  ? 'bg-amber-300 text-white cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }
            `}
          >
            {uploadRestore.isPending ? (
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
                Restoring...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload .db File
              </>
            )}
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            This will replace the current database. Make sure you have a backup first.
          </p>
        </div>
      </div>
    </div>
  );
};
