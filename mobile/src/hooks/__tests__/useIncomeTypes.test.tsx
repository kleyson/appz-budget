import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useIncomeTypes,
  useIncomeType,
  useCreateIncomeType,
  useUpdateIncomeType,
  useDeleteIncomeType,
} from '../useIncomeTypes';
import { incomeTypesApi } from '../../api/client';
import type { IncomeType, IncomeTypeCreate, IncomeTypeUpdate } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  incomeTypesApi: {
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

describe('useIncomeTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch income types successfully', async () => {
    const mockIncomeTypes: IncomeType[] = [
      { id: 1, name: 'Salary', color: '#10b981' },
      { id: 2, name: 'Freelance', color: '#3b82f6' },
    ];

    vi.mocked(incomeTypesApi.getAll).mockResolvedValue({
      data: mockIncomeTypes,
    } as any);

    const { result } = renderHook(() => useIncomeTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockIncomeTypes);
    expect(incomeTypesApi.getAll).toHaveBeenCalledOnce();
  });

  it('should handle error when fetching income types', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(incomeTypesApi.getAll).mockRejectedValue(error);

    const { result } = renderHook(() => useIncomeTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useIncomeType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch income type by id successfully', async () => {
    const mockIncomeType: IncomeType = {
      id: 1,
      name: 'Salary',
      color: '#10b981',
    };

    vi.mocked(incomeTypesApi.getById).mockResolvedValue({
      data: mockIncomeType,
    } as any);

    const { result } = renderHook(() => useIncomeType(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockIncomeType);
    expect(incomeTypesApi.getById).toHaveBeenCalledWith(1);
  });

  it('should not fetch when id is 0', () => {
    const { result } = renderHook(() => useIncomeType(0), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(incomeTypesApi.getById).not.toHaveBeenCalled();
  });
});

describe('useCreateIncomeType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create income type successfully', async () => {
    const newIncomeType: IncomeTypeCreate = {
      name: 'Investment',
      color: '#8b5cf6',
    };

    const createdIncomeType: IncomeType = {
      id: 3,
      name: 'Investment',
      color: '#8b5cf6',
    };

    vi.mocked(incomeTypesApi.create).mockResolvedValue({
      data: createdIncomeType,
    } as any);

    const { result } = renderHook(() => useCreateIncomeType(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newIncomeType);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(createdIncomeType);
    expect(incomeTypesApi.create).toHaveBeenCalledWith(newIncomeType);
  });

  it('should handle error when creating income type', async () => {
    const newIncomeType: IncomeTypeCreate = {
      name: 'Investment',
      color: '#8b5cf6',
    };

    const error = new Error('Failed to create');
    vi.mocked(incomeTypesApi.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateIncomeType(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newIncomeType);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useUpdateIncomeType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update income type successfully', async () => {
    const updateData: IncomeTypeUpdate = {
      name: 'Updated Salary',
      color: '#10b981',
    };

    const updatedIncomeType: IncomeType = {
      id: 1,
      name: 'Updated Salary',
      color: '#10b981',
    };

    vi.mocked(incomeTypesApi.update).mockResolvedValue({
      data: updatedIncomeType,
    } as any);

    const { result } = renderHook(() => useUpdateIncomeType(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedIncomeType);
    expect(incomeTypesApi.update).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle error when updating income type', async () => {
    const updateData: IncomeTypeUpdate = {
      name: 'Updated Salary',
    };

    const error = new Error('Failed to update');
    vi.mocked(incomeTypesApi.update).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateIncomeType(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useDeleteIncomeType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete income type successfully', async () => {
    vi.mocked(incomeTypesApi.delete).mockResolvedValue({} as any);

    const { result } = renderHook(() => useDeleteIncomeType(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(incomeTypesApi.delete).toHaveBeenCalledWith(1);
  });

  it('should handle error when deleting income type', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(incomeTypesApi.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteIncomeType(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

