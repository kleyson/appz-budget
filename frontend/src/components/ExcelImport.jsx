import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { importApi } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

export const ExcelImport = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (file) => importApi.importExcel(file).then(res => res.data),
    onSuccess: (data) => {
      const successMsg = data.message || `Successfully imported ${data.imported || 0} expense(s)`;
      setMessage(successMsg);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      setFile(null);
      setTimeout(() => setMessage(''), 5000);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.detail || error.message || 'Import failed';
      setMessage(errorMsg);
      setTimeout(() => setMessage(''), 8000);
    },
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleImport = () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }
    importMutation.mutate(file);
  };

  return (
    <div className="excel-import">
      <h2>Import from Excel</h2>
      <div className="import-controls">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />
        <button onClick={handleImport} disabled={!file || importMutation.isPending}>
          {importMutation.isPending ? 'Importing...' : 'Import'}
        </button>
      </div>
      {message && (
        <div className={`import-message ${importMutation.isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};
