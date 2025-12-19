import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useIncomes,
  useIncome,
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
} from '../useIncomes';
import { incomesApi } from '../../api/client';
import type { Income, IncomeCreate, IncomeUpdate } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  incomesApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

describe('useIncomes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch incomes successfully without params', async () => {
    const mockIncomes: Income[] = [
      {
        id: 1,
        income_type_id: 1,
        amount: 5000,
        budget: 5000,
        month_id: 1,
        period: 'Period 1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(incomesApi.getAll).mockResolvedValue({
      data: mockIncomes,
    } as any);

    const { result } = renderHook(() => useIncomes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockIncomes);
    expect(incomesApi.getAll).toHaveBeenCalledWith(undefined);
  });

  it('should fetch incomes with params', async () => {
    const mockIncomes: Income[] = [
      {
        id: 1,
        income_type_id: 1,
        amount: 5000,
        budget: 5000,
        month_id: 1,
        period: 'Period 1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const params = {
      period: 'Period 1',
      income_type_id: 1,
      month_id: 1,
    };

    vi.mocked(incomesApi.getAll).mockResolvedValue({
      data: mockIncomes,
    } as any);

    const { result } = renderHook(() => useIncomes(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockIncomes);
    expect(incomesApi.getAll).toHaveBeenCalledWith(params);
  });

  it('should handle error when fetching incomes', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(incomesApi.getAll).mockRejectedValue(error);

    const { result } = renderHook(() => useIncomes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useIncome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single income successfully', async () => {
    const mockIncome: Income = {
      id: 1,
      income_type_id: 1,
      amount: 5000,
      budget: 5000,
      month_id: 1,
      period: 'Period 1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(incomesApi.getById).mockResolvedValue({
      data: mockIncome,
    } as any);

    const { result } = renderHook(() => useIncome(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockIncome);
    expect(incomesApi.getById).toHaveBeenCalledWith(1);
  });

  it('should not fetch when id is 0', async () => {
    const { result } = renderHook(() => useIncome(0), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure the query doesn't fetch
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(incomesApi.getById).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
  });

  it('should handle error when fetching income', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(incomesApi.getById).mockRejectedValue(error);

    const { result } = renderHook(() => useIncome(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useCreateIncome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create income successfully', async () => {
    const newIncome: IncomeCreate = {
      income_type_id: 1,
      budget: 5000,
      amount: 5000,
      month_id: 1,
      period: 'Period 1',
    };

    const createdIncome: Income = {
      id: 2,
      ...newIncome,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(incomesApi.create).mockResolvedValue({
      data: createdIncome,
    } as any);

    const { result } = renderHook(() => useCreateIncome(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newIncome);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(createdIncome);
    expect(incomesApi.create).toHaveBeenCalledWith(newIncome);
  });

  it('should handle error when creating income', async () => {
    const newIncome: IncomeCreate = {
      income_type_id: 1,
      budget: 5000,
      amount: 5000,
      month_id: 1,
      period: 'Period 1',
    };

    const error = new Error('Failed to create');
    vi.mocked(incomesApi.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateIncome(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newIncome);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useUpdateIncome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update income successfully', async () => {
    const updateData: IncomeUpdate = {
      amount: 6000,
    };

    const updatedIncome: Income = {
      id: 1,
      income_type_id: 1,
      amount: 6000,
      budget: 5000,
      month_id: 1,
      period: 'Period 1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(incomesApi.update).mockResolvedValue({
      data: updatedIncome,
    } as any);

    const { result } = renderHook(() => useUpdateIncome(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedIncome);
    expect(incomesApi.update).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle error when updating income', async () => {
    const updateData: IncomeUpdate = {
      amount: 6000,
    };

    const error = new Error('Failed to update');
    vi.mocked(incomesApi.update).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateIncome(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useDeleteIncome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete income successfully', async () => {
    vi.mocked(incomesApi.delete).mockResolvedValue({} as any);

    const { result } = renderHook(() => useDeleteIncome(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(incomesApi.delete).toHaveBeenCalledWith(1);
  });

  it('should handle error when deleting income', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(incomesApi.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteIncome(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

