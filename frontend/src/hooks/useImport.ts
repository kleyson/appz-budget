import { useState, ChangeEvent, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { importApi } from '../api/client';
import { useCurrentMonth } from './useMonths';

interface ImportResult {
  message: string;
  imported: number;
}

export const useImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { data: currentMonth } = useCurrentMonth();

  const importMutation = useMutation<ImportResult, Error, { file: File; monthId: number }>({
    mutationFn: ({ file, monthId }) => importApi.importExcel(file, monthId).then((res) => res.data),
    onSuccess: (data) => {
      const successMsg = data.message || `Successfully imported ${data.imported || 0} expense(s)`;
      setMessage(successMsg);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setFile(null);
      setTimeout(() => setMessage(''), 5000);
    },
    onError: (error) => {
      const err = error as AxiosError<{ detail: string }>;
      const errorMsg = err.response?.data?.detail || err.message || 'Import failed';
      setMessage(errorMsg);
      setTimeout(() => setMessage(''), 8000);
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setMessage('');
  };

  const handleImport = () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }
    if (!selectedMonthId) {
      setMessage('Please select a month');
      return;
    }
    importMutation.mutate({ file, monthId: selectedMonthId });
  };

  // Set default month to current month when available
  useEffect(() => {
    if (currentMonth && !selectedMonthId) {
      setSelectedMonthId(currentMonth.id);
    }
  }, [currentMonth, selectedMonthId]);

  return {
    file,
    message,
    selectedMonthId,
    setSelectedMonthId,
    handleFileChange,
    handleImport,
    isImporting: importMutation.isPending,
    isError: importMutation.isError,
  };
};
