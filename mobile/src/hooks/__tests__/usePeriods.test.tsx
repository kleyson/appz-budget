import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  usePeriods,
  useCreatePeriod,
  useUpdatePeriod,
  useDeletePeriod,
  useRefreshPeriods,
} from "../usePeriods";
import { periodsApi } from "../../api/client";
import type { Period, PeriodCreate, PeriodUpdate } from "../../types";

// Mock the API client
vi.mock("../../api/client", () => ({
  periodsApi: {
    getAll: vi.fn(),
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

describe("usePeriods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch periods successfully", async () => {
    const mockPeriods: Period[] = [
      { id: 1, name: "Fixed", color: "#8b5cf6" },
      { id: 2, name: "1st Period", color: "#ec4899" },
    ];

    vi.mocked(periodsApi.getAll).mockResolvedValue({
      data: mockPeriods,
    } as any);

    const { result } = renderHook(() => usePeriods(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPeriods);
    expect(periodsApi.getAll).toHaveBeenCalledOnce();
  });

  it("should handle error when fetching periods", async () => {
    const error = new Error("Failed to fetch");
    vi.mocked(periodsApi.getAll).mockRejectedValue(error);

    const { result } = renderHook(() => usePeriods(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe("useCreatePeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create period successfully", async () => {
    const newPeriod: PeriodCreate = {
      name: "2nd Period",
      color: "#06b6d4",
    };

    const createdPeriod: Period = {
      id: 3,
      name: "2nd Period",
      color: "#06b6d4",
    };

    vi.mocked(periodsApi.create).mockResolvedValue({
      data: createdPeriod,
    } as any);

    const { result } = renderHook(() => useCreatePeriod(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newPeriod);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(createdPeriod);
    expect(periodsApi.create).toHaveBeenCalledWith(newPeriod);
  });

  it("should handle error when creating period", async () => {
    const newPeriod: PeriodCreate = {
      name: "2nd Period",
      color: "#06b6d4",
    };

    const error = new Error("Failed to create");
    vi.mocked(periodsApi.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreatePeriod(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newPeriod);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe("useUpdatePeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update period successfully", async () => {
    const updateData: PeriodUpdate = {
      name: "Updated Fixed",
      color: "#10b981",
    };

    const updatedPeriod: Period = {
      id: 1,
      name: "Updated Fixed",
      color: "#10b981",
    };

    vi.mocked(periodsApi.update).mockResolvedValue({
      data: updatedPeriod,
    } as any);

    const { result } = renderHook(() => useUpdatePeriod(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedPeriod);
    expect(periodsApi.update).toHaveBeenCalledWith(1, updateData);
  });

  it("should handle error when updating period", async () => {
    const updateData: PeriodUpdate = {
      name: "Updated Fixed",
    };

    const error = new Error("Failed to update");
    vi.mocked(periodsApi.update).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdatePeriod(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe("useDeletePeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete period successfully", async () => {
    vi.mocked(periodsApi.delete).mockResolvedValue({} as any);

    const { result } = renderHook(() => useDeletePeriod(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(periodsApi.delete).toHaveBeenCalledWith(1);
  });

  it("should handle error when deleting period", async () => {
    const error = new Error("Failed to delete");
    vi.mocked(periodsApi.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeletePeriod(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe("useRefreshPeriods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return refresh function and isRefreshing state", () => {
    const { result } = renderHook(() => useRefreshPeriods(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("refresh");
    expect(result.current).toHaveProperty("isRefreshing");
    expect(result.current.isRefreshing).toBe(false);
    expect(typeof result.current.refresh).toBe("function");
  });

  it("should set isRefreshing to true when refresh starts", async () => {
    const { result } = renderHook(() => useRefreshPeriods(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const refreshPromise = result.current.refresh();
      await vi.runAllTimersAsync();
      await refreshPromise;
    });

    expect(result.current.isRefreshing).toBe(false);
  });

  it("should invalidate and refetch periods queries", async () => {
    const { result } = renderHook(() => useRefreshPeriods(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const refreshPromise = result.current.refresh();
      await vi.runAllTimersAsync();
      await refreshPromise;
    });

    expect(result.current.isRefreshing).toBe(false);
  });

  it("should handle errors and reset isRefreshing", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() => useRefreshPeriods(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      const refreshPromise = result.current.refresh();
      await vi.runAllTimersAsync();
      await refreshPromise;
    });

    expect(result.current.isRefreshing).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it("should wait minimum 500ms before completing", async () => {
    const { result } = renderHook(() => useRefreshPeriods(), {
      wrapper: createWrapper(),
    });

    let refreshPromise: Promise<void>;
    await act(async () => {
      refreshPromise = result.current.refresh();
    });

    // Check that it's refreshing immediately after starting
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      // Advance 400ms - should still be refreshing
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      // Advance remaining 100ms and wait for completion
      await vi.advanceTimersByTimeAsync(100);
      await refreshPromise!;
    });

    expect(result.current.isRefreshing).toBe(false);
  });
});
