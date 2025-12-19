import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomesApi } from '../api/client';
import type { Income, IncomeCreate, IncomeUpdate } from '../types';

interface UseIncomesParams {
  period?: string | null;
  income_type?: string | null;
  month_id?: number | null;
}

export const useIncomes = (params?: UseIncomesParams) => {
  return useQuery<Income[]>({
    queryKey: ['incomes', params],
    queryFn: () => incomesApi.getAll(params).then((res) => res.data),
  });
};

export const useIncome = (id: number) => {
  return useQuery<Income>({
    queryKey: ['incomes', id],
    queryFn: () => incomesApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation<Income, Error, IncomeCreate>({
    mutationFn: (data) => incomesApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();

  return useMutation<Income, Error, { id: number; data: IncomeUpdate }>({
    mutationFn: ({ id, data }) => incomesApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => incomesApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
};
