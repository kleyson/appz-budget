import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCategories,
  useCategorySummary,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../useCategories';
import { categoriesApi } from '../../api/client';
import type { Category, CategoryCreate, CategoryUpdate, CategorySummary } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  categoriesApi: {
    getAll: vi.fn(),
    getSummary: vi.fn(),
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

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch categories successfully', async () => {
    const mockCategories: Category[] = [
      { id: 1, name: 'Groceries', color: '#8b5cf6' },
      { id: 2, name: 'Transport', color: '#ec4899' },
    ];

    vi.mocked(categoriesApi.getAll).mockResolvedValue({
      data: mockCategories,
    } as any);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockCategories);
    expect(categoriesApi.getAll).toHaveBeenCalledOnce();
  });

  it('should handle error when fetching categories', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(categoriesApi.getAll).mockRejectedValue(error);

    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useCategorySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch category summary successfully with period', async () => {
    const mockSummary: CategorySummary[] = [
      {
        category: 'Groceries',
        budget: 500,
        total: 450,
        over_budget: false,
      },
    ];

    vi.mocked(categoriesApi.getSummary).mockResolvedValue({
      data: mockSummary,
    } as any);

    const { result } = renderHook(() => useCategorySummary('Period 1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSummary);
    expect(categoriesApi.getSummary).toHaveBeenCalledWith('Period 1');
  });

  it('should fetch category summary without period', async () => {
    const mockSummary: CategorySummary[] = [];

    vi.mocked(categoriesApi.getSummary).mockResolvedValue({
      data: mockSummary,
    } as any);

    const { result } = renderHook(() => useCategorySummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.getSummary).toHaveBeenCalledWith(null);
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create category successfully', async () => {
    const newCategory: CategoryCreate = {
      name: 'Entertainment',
      color: '#06b6d4',
    };

    const createdCategory: Category = {
      id: 3,
      name: 'Entertainment',
      color: '#06b6d4',
    };

    vi.mocked(categoriesApi.create).mockResolvedValue({
      data: createdCategory,
    } as any);

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newCategory);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(createdCategory);
    expect(categoriesApi.create).toHaveBeenCalledWith(newCategory);
  });

  it('should handle error when creating category', async () => {
    const newCategory: CategoryCreate = {
      name: 'Entertainment',
      color: '#06b6d4',
    };

    const error = new Error('Failed to create');
    vi.mocked(categoriesApi.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newCategory);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useUpdateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update category successfully', async () => {
    const updateData: CategoryUpdate = {
      name: 'Updated Groceries',
      color: '#10b981',
    };

    const updatedCategory: Category = {
      id: 1,
      name: 'Updated Groceries',
      color: '#10b981',
    };

    vi.mocked(categoriesApi.update).mockResolvedValue({
      data: updatedCategory,
    } as any);

    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedCategory);
    expect(categoriesApi.update).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle error when updating category', async () => {
    const updateData: CategoryUpdate = {
      name: 'Updated Groceries',
    };

    const error = new Error('Failed to update');
    vi.mocked(categoriesApi.update).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useDeleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete category successfully', async () => {
    vi.mocked(categoriesApi.delete).mockResolvedValue({} as any);

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoriesApi.delete).toHaveBeenCalledWith(1);
  });

  it('should handle error when deleting category', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(categoriesApi.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

