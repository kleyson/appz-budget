import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useImport } from '../useImport';
import { importApi } from '../../api/client';
import { useCurrentMonth } from '../useMonths';
import type { Month } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  importApi: {
    importExcel: vi.fn(),
  },
}));

// Mock useCurrentMonth
vi.mock('../useMonths', () => ({
  useCurrentMonth: vi.fn(),
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

describe('useImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    vi.mocked(useCurrentMonth).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    expect(result.current.file).toBeNull();
    expect(result.current.message).toBe('');
    expect(result.current.selectedMonthId).toBeNull();
    expect(result.current.isImporting).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should set default month to current month when available', async () => {
    const mockCurrentMonth: Month = {
      id: 1,
      year: 2024,
      month: 11,
      name: 'November 2024',
      start_date: '2024-11-01',
      end_date: '2024-11-30',
      is_closed: false,
    };

    vi.mocked(useCurrentMonth).mockReturnValue({
      data: mockCurrentMonth,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    // Wait for useEffect to run
    await waitFor(
      () => {
        expect(result.current.selectedMonthId).toBe(1);
      },
      { timeout: 1000 }
    );
  });

  it('should handle file change', () => {
    vi.mocked(useCurrentMonth).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const event = {
      target: {
        files: [file],
      },
    } as any;

    act(() => {
      result.current.handleFileChange(event);
    });

    expect(result.current.file).toBe(file);
    expect(result.current.message).toBe('');
  });

  it('should show error message when trying to import without file', () => {
    vi.mocked(useCurrentMonth).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleImport();
    });

    expect(result.current.message).toBe('Please select a file');
  });

  it('should show error message when trying to import without month', () => {
    vi.mocked(useCurrentMonth).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const event = {
      target: {
        files: [file],
      },
    } as any;

    act(() => {
      result.current.handleFileChange(event);
    });

    expect(result.current.file).toBe(file);

    act(() => {
      result.current.handleImport();
    });

    expect(result.current.message).toBe('Please select a month');
  });

  it('should call import API when file and month are provided', async () => {
    vi.mocked(useCurrentMonth).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const mockResponse = {
      data: {
        message: 'Successfully imported 2 expense(s)',
        imported: 2,
      },
    };

    vi.mocked(importApi.importExcel).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const event = {
      target: {
        files: [file],
      },
    } as any;

    act(() => {
      result.current.handleFileChange(event);
      result.current.setSelectedMonthId(1);
    });

    act(() => {
      result.current.handleImport();
    });

    await waitFor(
      () => {
        expect(importApi.importExcel).toHaveBeenCalledWith(file, 1);
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(result.current.message).toBe('Successfully imported 2 expense(s)');
      },
      { timeout: 2000 }
    );
  });

  it('should handle import success and reset file', async () => {
    vi.mocked(useCurrentMonth).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    // Mock document.querySelector for file input reset
    const mockFileInput = { value: '' };
    vi.spyOn(document, 'querySelector').mockReturnValue(mockFileInput as any);

    const mockResponse = {
      data: {
        message: 'Successfully imported 2 expense(s)',
        imported: 2,
      },
    };

    vi.mocked(importApi.importExcel).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const event = {
      target: {
        files: [file],
      },
    } as any;

    act(() => {
      result.current.handleFileChange(event);
      result.current.setSelectedMonthId(1);
    });

    act(() => {
      result.current.handleImport();
    });

    await waitFor(
      () => {
        expect(result.current.message).toBe('Successfully imported 2 expense(s)');
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(result.current.file).toBeNull();
      },
      { timeout: 2000 }
    );

    expect(mockFileInput.value).toBe('');
  });

  it('should handle import error', async () => {
    vi.mocked(useCurrentMonth).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const error = {
      response: {
        data: {
          detail: 'Invalid file format',
        },
      },
      message: 'Request failed',
    };

    vi.mocked(importApi.importExcel).mockRejectedValue(error);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const event = {
      target: {
        files: [file],
      },
    } as any;

    act(() => {
      result.current.handleFileChange(event);
      result.current.setSelectedMonthId(1);
    });

    act(() => {
      result.current.handleImport();
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(result.current.message).toBe('Invalid file format');
      },
      { timeout: 2000 }
    );
  });

  it('should allow setting selected month ID', () => {
    vi.mocked(useCurrentMonth).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useImport(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedMonthId(5);
    });

    expect(result.current.selectedMonthId).toBe(5);
  });
});
