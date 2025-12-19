import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../api/client';
import type {
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseFilters,
  PayExpenseRequest,
} from '../types';

export const useExpenses = (filters: ExpenseFilters = {}) => {
  return useQuery<Expense[]>({
    queryKey: ['expenses', filters],
    queryFn: () => expensesApi.getAll(filters).then((res) => res.data),
  });
};

export const useExpense = (id: number) => {
  return useQuery<Expense>({
    queryKey: ['expenses', id],
    queryFn: () => expensesApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, ExpenseCreate>({
    mutationFn: (data) => expensesApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, { id: number; data: ExpenseUpdate }>({
    mutationFn: ({ id, data }) => expensesApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => expensesApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useReorderExpenses = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Expense[],
    Error,
    { expenseIds: number[]; filters: ExpenseFilters },
    { previousExpenses: Expense[] | undefined }
  >({
    mutationFn: ({ expenseIds }) => expensesApi.reorder(expenseIds).then((res) => res.data),
    onMutate: async ({ expenseIds, filters }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['expenses', filters] });

      // Snapshot the previous value
      const previousExpenses = queryClient.getQueryData<Expense[]>(['expenses', filters]);

      // Optimistically update to the new order
      if (previousExpenses) {
        // Create a map for quick lookup
        const expenseMap = new Map(previousExpenses.map((exp) => [exp.id, exp]));

        // Reorder expenses based on expenseIds
        const reorderedExpenses = expenseIds
          .map((id) => expenseMap.get(id))
          .filter((exp): exp is Expense => exp !== undefined)
          .map((exp, index) => ({ ...exp, order: index }));

        // Update the cache
        queryClient.setQueryData<Expense[]>(['expenses', filters], reorderedExpenses);
      }

      // Return context with the previous value
      return { previousExpenses };
    },
    onSuccess: (data, variables) => {
      // Update cache with the response data (which has the correct order from server)
      queryClient.setQueryData<Expense[]>(['expenses', variables.filters], data);
    },
    onError: (_err, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses', variables.filters], context.previousExpenses);
      }
    },
  });
};

export const useCloneExpensesToNextMonth = () => {
  const queryClient = useQueryClient();

  return useMutation<
    {
      message: string;
      cloned_count: number;
      cloned_income_count: number;
      next_month_id: number;
      next_month_name: string;
    },
    Error,
    number
  >({
    mutationFn: (monthId) => expensesApi.cloneToNextMonth(monthId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['months'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const usePayExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, { id: number; data?: PayExpenseRequest }>({
    mutationFn: ({ id, data }) => expensesApi.pay(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};
