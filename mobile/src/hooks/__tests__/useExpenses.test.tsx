import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useExpenses,
  useExpense,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCloneExpensesToNextMonth,
  usePayExpense,
} from '../useExpenses';
import { expensesApi } from '../../api/client';
import type { Expense, ExpenseCreate, ExpenseUpdate, ExpenseFilters, PayExpenseRequest } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  expensesApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    cloneToNextMonth: vi.fn(),
    pay: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch expenses successfully without filters', async () => {
    const mockExpenses: Expense[] = [
      {
        id: 1,
        expense_name: 'Grocery Shopping',
        period: 'Fixed',
        category: 'Groceries',
        budget: 500,
        cost: 450,
        notes: 'Weekly shopping',
        month_id: 1,
        purchases: null,
      },
    ];

    vi.mocked(expensesApi.getAll).mockResolvedValue({
      data: mockExpenses,
    } as any);

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockExpenses);
    expect(expensesApi.getAll).toHaveBeenCalledWith({});
  });

  it('should fetch expenses with filters', async () => {
    const mockExpenses: Expense[] = [
      {
        id: 1,
        expense_name: 'Grocery Shopping',
        period: 'Fixed',
        category: 'Groceries',
        budget: 500,
        cost: 450,
        notes: null,
        month_id: 1,
        purchases: null,
      },
    ];

    const filters: ExpenseFilters = {
      period: 'Fixed',
      category: 'Groceries',
      month_id: 1,
    };

    vi.mocked(expensesApi.getAll).mockResolvedValue({
      data: mockExpenses,
    } as any);

    const { result } = renderHook(() => useExpenses(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockExpenses);
    expect(expensesApi.getAll).toHaveBeenCalledWith(filters);
  });

  it('should handle error when fetching expenses', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(expensesApi.getAll).mockRejectedValue(error);

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single expense successfully', async () => {
    const mockExpense: Expense = {
      id: 1,
      expense_name: 'Grocery Shopping',
      period: 'Fixed',
      category: 'Groceries',
      budget: 500,
      cost: 450,
      notes: 'Weekly shopping',
      month_id: 1,
      purchases: null,
    };

    vi.mocked(expensesApi.getById).mockResolvedValue({
      data: mockExpense,
    } as any);

    const { result } = renderHook(() => useExpense(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockExpense);
    expect(expensesApi.getById).toHaveBeenCalledWith(1);
  });

  it('should not fetch when id is 0', async () => {
    const { result } = renderHook(() => useExpense(0), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure the query doesn't fetch
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(expensesApi.getById).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
  });

  it('should handle error when fetching expense', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(expensesApi.getById).mockRejectedValue(error);

    const { result } = renderHook(() => useExpense(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useCreateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create expense successfully', async () => {
    const newExpense: ExpenseCreate = {
      expense_name: 'New Expense',
      period: 'Fixed',
      category: 'Groceries',
      budget: 300,
      cost: 250,
      notes: 'Test expense',
      month_id: 1,
      purchases: null,
    };

    const createdExpense: Expense = {
      id: 2,
      ...newExpense,
    };

    vi.mocked(expensesApi.create).mockResolvedValue({
      data: createdExpense,
    } as any);

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newExpense);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(createdExpense);
    expect(expensesApi.create).toHaveBeenCalledWith(newExpense);
  });

  it('should handle error when creating expense', async () => {
    const newExpense: ExpenseCreate = {
      expense_name: 'New Expense',
      period: 'Fixed',
      category: 'Groceries',
      budget: 300,
      cost: 250,
      month_id: 1,
    };

    const error = new Error('Failed to create');
    vi.mocked(expensesApi.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newExpense);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useUpdateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update expense successfully', async () => {
    const updateData: ExpenseUpdate = {
      expense_name: 'Updated Expense',
      cost: 300,
    };

    const updatedExpense: Expense = {
      id: 1,
      expense_name: 'Updated Expense',
      period: 'Fixed',
      category: 'Groceries',
      budget: 500,
      cost: 300,
      notes: null,
      month_id: 1,
      purchases: null,
    };

    vi.mocked(expensesApi.update).mockResolvedValue({
      data: updatedExpense,
    } as any);

    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedExpense);
    expect(expensesApi.update).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle error when updating expense', async () => {
    const updateData: ExpenseUpdate = {
      cost: 300,
    };

    const error = new Error('Failed to update');
    vi.mocked(expensesApi.update).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useDeleteExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete expense successfully', async () => {
    vi.mocked(expensesApi.delete).mockResolvedValue({} as any);

    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(expensesApi.delete).toHaveBeenCalledWith(1);
  });

  it('should handle error when deleting expense', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(expensesApi.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useCloneExpensesToNextMonth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clone expenses to next month successfully', async () => {
    const mockResponse = {
      message: 'Successfully cloned 3 expenses to December 2024',
      cloned_count: 3,
      cloned_income_count: 0,
      next_month_id: 2,
      next_month_name: 'December 2024',
    };

    vi.mocked(expensesApi.cloneToNextMonth).mockResolvedValue({
      data: mockResponse,
    } as any);

    const { result } = renderHook(() => useCloneExpensesToNextMonth(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(expensesApi.cloneToNextMonth).toHaveBeenCalledWith(1);
  });

  it('should handle error when cloning expenses', async () => {
    const error = new Error('Failed to clone');
    vi.mocked(expensesApi.cloneToNextMonth).mockRejectedValue(error);

    const { result } = renderHook(() => useCloneExpensesToNextMonth(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('usePayExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pay expense successfully', async () => {
    const payData: PayExpenseRequest = {
      amount: 100,
    };

    const paidExpense: Expense = {
      id: 1,
      expense_name: 'Grocery Shopping',
      period: 'Fixed',
      category: 'Groceries',
      budget: 500,
      cost: 100,
      notes: null,
      month_id: 1,
      purchases: null,
    };

    vi.mocked(expensesApi.pay).mockResolvedValue({
      data: paidExpense,
    } as any);

    const { result } = renderHook(() => usePayExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: payData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(paidExpense);
    expect(expensesApi.pay).toHaveBeenCalledWith(1, payData);
  });

  it('should pay expense without data', async () => {
    const paidExpense: Expense = {
      id: 1,
      expense_name: 'Grocery Shopping',
      period: 'Fixed',
      category: 'Groceries',
      budget: 500,
      cost: 500,
      notes: null,
      month_id: 1,
      purchases: null,
    };

    vi.mocked(expensesApi.pay).mockResolvedValue({
      data: paidExpense,
    } as any);

    const { result } = renderHook(() => usePayExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(paidExpense);
    expect(expensesApi.pay).toHaveBeenCalledWith(1, undefined);
  });

  it('should handle error when paying expense', async () => {
    const payData: PayExpenseRequest = {
      amount: 100,
    };

    const error = new Error('Failed to pay');
    vi.mocked(expensesApi.pay).mockRejectedValue(error);

    const { result } = renderHook(() => usePayExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: payData });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

