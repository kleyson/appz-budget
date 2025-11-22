import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { periodsApi } from '../api/client';

export const usePeriods = () => {
  return useQuery({
    queryKey: ['periods'],
    queryFn: () => periodsApi.getAll().then(res => res.data),
  });
};

export const useCreatePeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => periodsApi.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
    },
  });
};

export const useUpdatePeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => periodsApi.update(id, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'summary'] });
    },
  });
};

export const useDeletePeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => periodsApi.delete(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
    },
  });
};
