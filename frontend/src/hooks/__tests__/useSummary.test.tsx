import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSummaryTotals, useIncomeTypeSummary, useExpensePeriodSummary } from '../useSummary';
import { incomeTypesApi, summaryApi } from '../../api/client';
import type { ExpensePeriodSummary, IncomeTypeSummary, SummaryTotals } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  summaryApi: {
    getTotals: vi.fn(),
    getExpensesByPeriod: vi.fn(),
  },
  incomeTypesApi: {
    getSummary: vi.fn(),
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

describe('useSummaryTotals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch summary totals successfully', async () => {
    const mockTotals: SummaryTotals = {
      total_budget_expenses: 10000.0,
      total_current_expenses: 9500.0,
      total_budget_income: 15000.0,
      total_current_income: 14500.0,
      total_budget: 5000.0,
      total_current: 5000.0,
    };

    vi.mocked(summaryApi.getTotals).mockResolvedValue({
      data: mockTotals,
    } as any);

    const { result } = renderHook(() => useSummaryTotals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTotals);
    expect(summaryApi.getTotals).toHaveBeenCalledWith(undefined);
  });

  it('should fetch summary totals with filters', async () => {
    const mockTotals: SummaryTotals = {
      total_budget_expenses: 5000.0,
      total_current_expenses: 4500.0,
      total_budget_income: 7500.0,
      total_current_income: 7000.0,
      total_budget: 2500.0,
      total_current: 2500.0,
    };

    vi.mocked(summaryApi.getTotals).mockResolvedValue({
      data: mockTotals,
    } as any);

    const { result } = renderHook(() => useSummaryTotals({ period: 'Period 1', month_id: 1 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTotals);
    expect(summaryApi.getTotals).toHaveBeenCalledWith({
      period: 'Period 1',
      month_id: 1,
    });
  });

  it('should handle error when fetching summary totals', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(summaryApi.getTotals).mockRejectedValue(error);

    const { result } = renderHook(() => useSummaryTotals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useIncomeTypeSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch income type summary successfully', async () => {
    const mockSummary: IncomeTypeSummary[] = [
      {
        income_type: 'Salary',
        budget: 10000.0,
        total: 10000.0,
      },
      {
        income_type: 'Freelance',
        budget: 5000.0,
        total: 4500.0,
      },
    ];

    vi.mocked(incomeTypesApi.getSummary).mockResolvedValue({
      data: mockSummary,
    } as any);

    const { result } = renderHook(() => useIncomeTypeSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSummary);
    expect(incomeTypesApi.getSummary).toHaveBeenCalledWith(undefined);
  });

  it('should fetch income type summary with filters', async () => {
    const mockSummary: IncomeTypeSummary[] = [
      {
        income_type: 'Salary',
        budget: 5000.0,
        total: 5000.0,
      },
    ];

    vi.mocked(incomeTypesApi.getSummary).mockResolvedValue({
      data: mockSummary,
    } as any);

    const { result } = renderHook(() => useIncomeTypeSummary({ period: 'Period 1', month_id: 1 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSummary);
    expect(incomeTypesApi.getSummary).toHaveBeenCalledWith({
      period: 'Period 1',
      month_id: 1,
    });
  });

  it('should handle error when fetching income type summary', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(incomeTypesApi.getSummary).mockRejectedValue(error);

    const { result } = renderHook(() => useIncomeTypeSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useExpensePeriodSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch expense period summary successfully', async () => {
    const mockSummary: ExpensePeriodSummary[] = [
      {
        period: 'Monthly',
        color: '#3b82f6',
        budget: 5000.0,
        total: 4500.0,
        over_budget: false,
      },
      {
        period: 'Yearly',
        color: '#10b981',
        budget: 10000.0,
        total: 10500.0,
        over_budget: true,
      },
    ];

    vi.mocked(summaryApi.getExpensesByPeriod).mockResolvedValue({
      data: mockSummary,
    } as any);

    const { result } = renderHook(() => useExpensePeriodSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSummary);
    expect(summaryApi.getExpensesByPeriod).toHaveBeenCalledWith(undefined);
  });

  it('should fetch expense period summary with month filter', async () => {
    const mockSummary: ExpensePeriodSummary[] = [
      {
        period: 'Monthly',
        color: '#3b82f6',
        budget: 3000.0,
        total: 2800.0,
        over_budget: false,
      },
    ];

    vi.mocked(summaryApi.getExpensesByPeriod).mockResolvedValue({
      data: mockSummary,
    } as any);

    const { result } = renderHook(() => useExpensePeriodSummary({ month_id: 1 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSummary);
    expect(summaryApi.getExpensesByPeriod).toHaveBeenCalledWith({ month_id: 1 });
  });

  it('should handle error when fetching expense period summary', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(summaryApi.getExpensesByPeriod).mockRejectedValue(error);

    const { result } = renderHook(() => useExpensePeriodSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
