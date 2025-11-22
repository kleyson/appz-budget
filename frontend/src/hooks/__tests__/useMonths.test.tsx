import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useMonths,
  useCurrentMonth,
  useMonth,
  useMonthByYearMonth,
  useCreateMonth,
  useUpdateMonth,
  useDeleteMonth,
} from '../useMonths';
import { monthsApi } from '../../api/client';
import type { Month, MonthCreate, MonthUpdate } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  monthsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getCurrent: vi.fn(),
    getByYearMonth: vi.fn(),
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

describe('useMonths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch months successfully', async () => {
    const mockMonths: Month[] = [
      {
        id: 1,
        year: 2024,
        month: 11,
        name: 'November 2024',
        start_date: '2024-11-01',
        end_date: '2024-11-30',
      },
      {
        id: 2,
        year: 2024,
        month: 12,
        name: 'December 2024',
        start_date: '2024-12-01',
        end_date: '2024-12-31',
      },
    ];

    vi.mocked(monthsApi.getAll).mockResolvedValue({
      data: mockMonths,
    } as any);

    const { result } = renderHook(() => useMonths(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMonths);
    expect(monthsApi.getAll).toHaveBeenCalledOnce();
  });

  it('should handle error when fetching months', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(monthsApi.getAll).mockRejectedValue(error);

    const { result } = renderHook(() => useMonths(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useCurrentMonth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch current month successfully', async () => {
    const mockMonth: Month = {
      id: 1,
      year: 2024,
      month: 11,
      name: 'November 2024',
      start_date: '2024-11-01',
      end_date: '2024-11-30',
    };

    vi.mocked(monthsApi.getCurrent).mockResolvedValue({
      data: mockMonth,
    } as any);

    const { result } = renderHook(() => useCurrentMonth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMonth);
    expect(monthsApi.getCurrent).toHaveBeenCalledOnce();
  });

  it('should handle error when fetching current month', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(monthsApi.getCurrent).mockRejectedValue(error);

    const { result } = renderHook(() => useCurrentMonth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useMonth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch month by id successfully', async () => {
    const mockMonth: Month = {
      id: 1,
      year: 2024,
      month: 11,
      name: 'November 2024',
      start_date: '2024-11-01',
      end_date: '2024-11-30',
    };

    vi.mocked(monthsApi.getById).mockResolvedValue({
      data: mockMonth,
    } as any);

    const { result } = renderHook(() => useMonth(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMonth);
    expect(monthsApi.getById).toHaveBeenCalledWith(1);
  });

  it('should not fetch when id is 0', async () => {
    const { result } = renderHook(() => useMonth(0), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure the query doesn't fetch
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(monthsApi.getById).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
  });

  it('should handle error when fetching month', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(monthsApi.getById).mockRejectedValue(error);

    const { result } = renderHook(() => useMonth(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useMonthByYearMonth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch month by year and month successfully', async () => {
    const mockMonth: Month = {
      id: 1,
      year: 2024,
      month: 11,
      name: 'November 2024',
      start_date: '2024-11-01',
      end_date: '2024-11-30',
    };

    vi.mocked(monthsApi.getByYearMonth).mockResolvedValue({
      data: mockMonth,
    } as any);

    const { result } = renderHook(() => useMonthByYearMonth(2024, 11), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMonth);
    expect(monthsApi.getByYearMonth).toHaveBeenCalledWith(2024, 11);
  });

  it('should not fetch when year or month is 0', async () => {
    const { result } = renderHook(() => useMonthByYearMonth(0, 11), {
      wrapper: createWrapper(),
    });

    // Wait a bit to ensure the query doesn't fetch
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(monthsApi.getByYearMonth).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
  });

  it('should handle error when fetching month by year and month', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(monthsApi.getByYearMonth).mockRejectedValue(error);

    const { result } = renderHook(() => useMonthByYearMonth(2024, 11), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useCreateMonth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create month successfully', async () => {
    const newMonth: MonthCreate = {
      year: 2024,
      month: 12,
    };

    const createdMonth: Month = {
      id: 3,
      year: 2024,
      month: 12,
      name: 'December 2024',
      start_date: '2024-12-01',
      end_date: '2024-12-31',
    };

    vi.mocked(monthsApi.create).mockResolvedValue({
      data: createdMonth,
    } as any);

    const { result } = renderHook(() => useCreateMonth(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newMonth);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(createdMonth);
    expect(monthsApi.create).toHaveBeenCalledWith(newMonth);
  });

  it('should handle error when creating month', async () => {
    const newMonth: MonthCreate = {
      year: 2024,
      month: 12,
    };

    const error = new Error('Failed to create');
    vi.mocked(monthsApi.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateMonth(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newMonth);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useUpdateMonth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update month successfully', async () => {
    const updateData: MonthUpdate = {
      name: 'Updated November 2024',
    };

    const updatedMonth: Month = {
      id: 1,
      year: 2024,
      month: 11,
      name: 'Updated November 2024',
      start_date: '2024-11-01',
      end_date: '2024-11-30',
    };

    vi.mocked(monthsApi.update).mockResolvedValue({
      data: updatedMonth,
    } as any);

    const { result } = renderHook(() => useUpdateMonth(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedMonth);
    expect(monthsApi.update).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle error when updating month', async () => {
    const updateData: MonthUpdate = {
      name: 'Updated November 2024',
    };

    const error = new Error('Failed to update');
    vi.mocked(monthsApi.update).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateMonth(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useDeleteMonth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete month successfully', async () => {
    vi.mocked(monthsApi.delete).mockResolvedValue({} as any);

    const { result } = renderHook(() => useDeleteMonth(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(monthsApi.delete).toHaveBeenCalledWith(1);
  });

  it('should handle error when deleting month', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(monthsApi.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteMonth(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
