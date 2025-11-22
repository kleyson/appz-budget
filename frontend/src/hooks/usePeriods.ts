import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { periodsApi } from '../api/client';
import type { Period, PeriodCreate, PeriodUpdate } from '../types';

export const usePeriods = () => {
  return useQuery<Period[]>({
    queryKey: ['periods'],
    queryFn: () => periodsApi.getAll().then((res) => res.data),
  });
};

export const useCreatePeriod = () => {
  const queryClient = useQueryClient();

  return useMutation<Period, Error, PeriodCreate>({
    mutationFn: (data) => periodsApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
    },
  });
};

export const useUpdatePeriod = () => {
  const queryClient = useQueryClient();

  return useMutation<Period, Error, { id: number; data: PeriodUpdate }>({
    mutationFn: ({ id, data }) => periodsApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'summary'] });
    },
  });
};

export const useDeletePeriod = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => periodsApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
    },
  });
};
