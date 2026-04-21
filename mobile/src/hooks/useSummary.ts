import { useQuery } from '@tanstack/react-query';
import { incomeTypesApi, summaryApi } from '../api/client';
import type {
  ExpensePeriodSummary,
  IncomeTypeSummary,
  MonthlyTrendsResponse,
  PeriodSummaryResponse,
  SummaryInsights,
  SummaryTotals,
} from '../types';

export const useSummaryTotals = (filters?: {
  period?: string | null;
  month_id?: number | null;
}) => {
  return useQuery<SummaryTotals, Error>({
    queryKey: ['summary', 'totals', filters],
    queryFn: () => summaryApi.getTotals(filters).then((res) => res.data),
  });
};

export const useIncomeTypeSummary = (filters?: {
  period?: string | null;
  month_id?: number | null;
}) => {
  return useQuery<IncomeTypeSummary[], Error>({
    queryKey: ['incomeTypes', 'summary', filters],
    queryFn: () => incomeTypesApi.getSummary(filters).then((res) => res.data),
  });
};

export const usePeriodSummary = (filters?: { month_id?: number | null }) => {
  return useQuery<PeriodSummaryResponse, Error>({
    queryKey: ['summary', 'by-period', filters],
    queryFn: () => summaryApi.getByPeriod(filters).then((res) => res.data),
  });
};

export const useExpensePeriodSummary = (filters?: { month_id?: number | null }) => {
  return useQuery<ExpensePeriodSummary[], Error>({
    queryKey: ['summary', 'expenses-by-period', filters],
    queryFn: () => summaryApi.getExpensesByPeriod(filters).then((res) => res.data),
  });
};

export const useInsights = (filters?: { month_id?: number | null }) => {
  return useQuery<SummaryInsights, Error>({
    queryKey: ['summary', 'insights', filters],
    queryFn: () => summaryApi.getInsights(filters).then((res) => res.data),
  });
};

export const useMonthlyTrends = (params?: { num_months?: number }) => {
  return useQuery<MonthlyTrendsResponse, Error>({
    queryKey: ['summary', 'trends', params],
    queryFn: () => summaryApi.getMonthlyTrends(params).then((res) => res.data),
  });
};
