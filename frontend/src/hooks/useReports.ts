import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { summaryApi, backupsApi } from '../api/client';
import type { MonthlyTrendsResponse, BackupListResponse } from '../types';

export const useMonthlyTrends = (numMonths: number = 12) => {
  return useQuery<MonthlyTrendsResponse, Error>({
    queryKey: ['reports', 'monthly-trends', numMonths],
    queryFn: () => summaryApi.getMonthlyTrends({ num_months: numMonths }).then((res) => res.data),
  });
};

export const useBackups = () => {
  return useQuery<BackupListResponse, Error>({
    queryKey: ['backups'],
    queryFn: () => backupsApi.getAll().then((res) => res.data),
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => backupsApi.create().then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
};

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => backupsApi.delete(filename).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
};

export const useDownloadBackup = () => {
  return useMutation({
    mutationFn: async (filename: string) => {
      const res = await backupsApi.download(filename);
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
};

export const useRestoreBackup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filename: string) => backupsApi.restore(filename).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export const useUploadRestore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => backupsApi.uploadRestore(file).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};
