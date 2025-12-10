import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "../api/client";
import type {
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseFilters,
  PayExpenseRequest,
} from "../types";

export const useExpenses = (filters: ExpenseFilters = {}) => {
  return useQuery<Expense[]>({
    queryKey: ["expenses", filters],
    queryFn: () => expensesApi.getAll(filters).then((res) => res.data),
  });
};

export const useExpense = (id: number) => {
  return useQuery<Expense>({
    queryKey: ["expenses", id],
    queryFn: () => expensesApi.getById(id).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, ExpenseCreate>({
    mutationFn: (data) => expensesApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, { id: number; data: ExpenseUpdate }>({
    mutationFn: ({ id, data }) =>
      expensesApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => expensesApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
    mutationFn: (monthId) =>
      expensesApi.cloneToNextMonth(monthId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["months"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
    },
  });
};

export const usePayExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, { id: number; data?: PayExpenseRequest }>({
    mutationFn: ({ id, data }) =>
      expensesApi.pay(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

export const useRefreshBudgetData = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const queryKeys = [
        "expenses",
        "incomes",
        "categories",
        "periods",
        "income-types",
        "months",
        "summary",
      ];

      // Add minimum delay to ensure refresh UI is visible
      await Promise.all([
        Promise.all(
          queryKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: [key] })
          )
        ),
        Promise.all(
          queryKeys.map((key) =>
            queryClient.refetchQueries({
              queryKey: [key],
              type: "active",
              exact: false,
            })
          )
        ),
        new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms delay
      ]);
    } catch (error) {
      console.error("Error refreshing budget data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  return { refresh, isRefreshing };
};
