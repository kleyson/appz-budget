import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomeTypesApi } from '../api/client';
import type { IncomeType, IncomeTypeCreate, IncomeTypeUpdate } from '../types';

export const useIncomeTypes = () => {
  return useQuery<IncomeType[]>({
    queryKey: ['income-types'],
    queryFn: () => incomeTypesApi.getAll().then((res) => res.data),
  });
};

export const useIncomeType = (id: number) => {
  return useQuery<IncomeType>({
    queryKey: ['income-types', id],
    queryFn: () => incomeTypesApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateIncomeType = () => {
  const queryClient = useQueryClient();

  return useMutation<IncomeType, Error, IncomeTypeCreate>({
    mutationFn: (data) => incomeTypesApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-types'] });
    },
  });
};

export const useUpdateIncomeType = () => {
  const queryClient = useQueryClient();

  return useMutation<IncomeType, Error, { id: number; data: IncomeTypeUpdate }>({
    mutationFn: ({ id, data }) => incomeTypesApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-types'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
};

export const useDeleteIncomeType = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => incomeTypesApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-types'] });
    },
  });
};

