import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/client';
import type { Category, CategoryCreate, CategoryUpdate, CategorySummary } from '../types';

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((res) => res.data),
  });
};

export const useCategorySummary = (filters?: { month_id?: number | null }) => {
  return useQuery<CategorySummary[]>({
    queryKey: ['categories', 'summary', filters],
    queryFn: () => categoriesApi.getSummary(filters).then((res) => res.data),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, CategoryCreate>({
    mutationFn: (data) => categoriesApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, { id: number; data: CategoryUpdate }>({
    mutationFn: ({ id, data }) => categoriesApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'summary'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => categoriesApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
