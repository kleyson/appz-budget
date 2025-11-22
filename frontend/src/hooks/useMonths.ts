import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monthsApi } from '../api/client';
import type { Month, MonthCreate, MonthUpdate } from '../types';

export const useMonths = () => {
  return useQuery<Month[]>({
    queryKey: ['months'],
    queryFn: () => monthsApi.getAll().then((res) => res.data),
  });
};

export const useCurrentMonth = () => {
  return useQuery<Month>({
    queryKey: ['months', 'current'],
    queryFn: () => monthsApi.getCurrent().then((res) => res.data),
  });
};

export const useMonth = (id: number) => {
  return useQuery<Month>({
    queryKey: ['months', id],
    queryFn: () => monthsApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useMonthByYearMonth = (year: number, month: number) => {
  return useQuery<Month>({
    queryKey: ['months', year, month],
    queryFn: () => monthsApi.getByYearMonth(year, month).then((res) => res.data),
    enabled: !!year && !!month,
  });
};

export const useCreateMonth = () => {
  const queryClient = useQueryClient();

  return useMutation<Month, Error, MonthCreate>({
    mutationFn: (data) => monthsApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['months'] });
    },
  });
};

export const useUpdateMonth = () => {
  const queryClient = useQueryClient();

  return useMutation<Month, Error, { id: number; data: MonthUpdate }>({
    mutationFn: ({ id, data }) => monthsApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['months'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useDeleteMonth = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => monthsApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['months'] });
    },
  });
};
