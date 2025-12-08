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

export const useBackupDownloadUrl = () => {
  return useMutation({
    mutationFn: (filename: string) => backupsApi.getDownloadUrl(filename).then((res) => res.data),
  });
};
