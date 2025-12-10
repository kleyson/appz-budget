import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { periodsApi } from "../api/client";
import type { Period, PeriodCreate, PeriodUpdate } from "../types";

export const usePeriods = () => {
  return useQuery<Period[]>({
    queryKey: ["periods"],
    queryFn: () => periodsApi.getAll().then((res) => res.data),
  });
};

export const useCreatePeriod = () => {
  const queryClient = useQueryClient();

  return useMutation<Period, Error, PeriodCreate>({
    mutationFn: (data) => periodsApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
  });
};

export const useUpdatePeriod = () => {
  const queryClient = useQueryClient();

  return useMutation<Period, Error, { id: number; data: PeriodUpdate }>({
    mutationFn: ({ id, data }) =>
      periodsApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "summary"] });
    },
  });
};

export const useDeletePeriod = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => periodsApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
  });
};

export const useRefreshPeriods = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Add minimum delay to ensure refresh UI is visible
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["periods"] }),
        queryClient.refetchQueries({
          queryKey: ["periods"],
          type: "active",
          exact: false,
        }),
        new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms delay
      ]);
    } catch (error) {
      console.error("Error refreshing periods:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  return { refresh, isRefreshing };
};
