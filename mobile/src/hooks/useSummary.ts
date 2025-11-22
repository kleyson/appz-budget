import { useQuery } from '@tanstack/react-query';
import { incomeTypesApi, summaryApi } from '../api/client';
import type { IncomeTypeSummary, SummaryTotals } from '../types';

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

