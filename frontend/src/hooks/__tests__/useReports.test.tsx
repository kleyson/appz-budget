import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useMonthlyTrends,
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useBackupDownloadUrl,
} from '../useReports';
import { summaryApi, backupsApi } from '../../api/client';
import type { MonthlyTrendsResponse, BackupListResponse } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  summaryApi: {
    getMonthlyTrends: vi.fn(),
  },
  backupsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    getDownloadUrl: vi.fn(),
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

describe('useMonthlyTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch monthly trends successfully with default numMonths', async () => {
    const mockTrends: MonthlyTrendsResponse = {
      months: [
        {
          month_id: 1,
          month_name: 'January 2024',
          year: 2024,
          month: 1,
          total_expenses: 5000.0,
          total_income: 6000.0,
          net_savings: 1000.0,
          savings_rate: 16.67,
          categories: [],
        },
        {
          month_id: 2,
          month_name: 'February 2024',
          year: 2024,
          month: 2,
          total_expenses: 5500.0,
          total_income: 6000.0,
          net_savings: 500.0,
          savings_rate: 8.33,
          categories: [],
        },
      ],
      average_income: 6000.0,
      average_expenses: 5250.0,
      average_savings_rate: 12.5,
    };

    vi.mocked(summaryApi.getMonthlyTrends).mockResolvedValue({
      data: mockTrends,
    } as any);

    const { result } = renderHook(() => useMonthlyTrends(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTrends);
    expect(summaryApi.getMonthlyTrends).toHaveBeenCalledWith({ num_months: 12 });
  });

  it('should fetch monthly trends with custom numMonths', async () => {
    const mockTrends: MonthlyTrendsResponse = {
      months: [
        {
          month_id: 1,
          month_name: 'January 2024',
          year: 2024,
          month: 1,
          total_expenses: 5000.0,
          total_income: 6000.0,
          net_savings: 1000.0,
          savings_rate: 16.67,
          categories: [],
        },
      ],
      average_income: 6000.0,
      average_expenses: 5000.0,
      average_savings_rate: 16.67,
    };

    vi.mocked(summaryApi.getMonthlyTrends).mockResolvedValue({
      data: mockTrends,
    } as any);

    const { result } = renderHook(() => useMonthlyTrends(6), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTrends);
    expect(summaryApi.getMonthlyTrends).toHaveBeenCalledWith({ num_months: 6 });
  });

  it('should handle error when fetching monthly trends', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(summaryApi.getMonthlyTrends).mockRejectedValue(error);

    const { result } = renderHook(() => useMonthlyTrends(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useBackups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch backups successfully', async () => {
    const mockBackups: BackupListResponse = {
      backups: [
        {
          filename: 'backup_2024-01-01.db',
          size: 1024000,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          filename: 'backup_2024-01-02.db',
          size: 2048000,
          created_at: '2024-01-02T00:00:00Z',
        },
      ],
      backup_dir: '/backups',
    };

    vi.mocked(backupsApi.getAll).mockResolvedValue({
      data: mockBackups,
    } as any);

    const { result } = renderHook(() => useBackups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBackups);
    expect(backupsApi.getAll).toHaveBeenCalledOnce();
  });

  it('should handle error when fetching backups', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(backupsApi.getAll).mockRejectedValue(error);

    const { result } = renderHook(() => useBackups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useCreateBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create backup successfully', async () => {
    const mockResponse = {
      message: 'Backup created successfully',
      filename: 'backup_2024-01-01.db',
    };

    vi.mocked(backupsApi.create).mockResolvedValue({
      data: mockResponse,
    } as any);

    const { result } = renderHook(() => useCreateBackup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(backupsApi.create).toHaveBeenCalledOnce();
  });

  it('should handle error when creating backup', async () => {
    const error = new Error('Failed to create backup');
    vi.mocked(backupsApi.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateBackup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useDeleteBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete backup successfully', async () => {
    const mockResponse = {
      message: 'Backup deleted successfully',
    };

    vi.mocked(backupsApi.delete).mockResolvedValue({
      data: mockResponse,
    } as any);

    const { result } = renderHook(() => useDeleteBackup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('backup_2024-01-01.db');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(backupsApi.delete).toHaveBeenCalledWith('backup_2024-01-01.db');
  });

  it('should handle error when deleting backup', async () => {
    const error = new Error('Failed to delete backup');
    vi.mocked(backupsApi.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteBackup(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('backup_2024-01-01.db');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useBackupDownloadUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get backup download URL successfully', async () => {
    const mockResponse = {
      download_url: 'https://example.com/backups/backup_2024-01-01.db',
    };

    vi.mocked(backupsApi.getDownloadUrl).mockResolvedValue({
      data: mockResponse,
    } as any);

    const { result } = renderHook(() => useBackupDownloadUrl(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('backup_2024-01-01.db');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(backupsApi.getDownloadUrl).toHaveBeenCalledWith('backup_2024-01-01.db');
  });

  it('should handle error when getting backup download URL', async () => {
    const error = new Error('Failed to get download URL');
    vi.mocked(backupsApi.getDownloadUrl).mockRejectedValue(error);

    const { result } = renderHook(() => useBackupDownloadUrl(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('backup_2024-01-01.db');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});
