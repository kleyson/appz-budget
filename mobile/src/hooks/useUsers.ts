import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/client";
import type { User, UserRegister } from "../types";

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll().then((res) => res.data),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UserRegister & { is_active?: boolean }>({
    mutationFn: (data) => usersApi.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    Error,
    { id: number; data: Partial<User> & { is_active?: boolean } }
  >({
    mutationFn: ({ id, data }) =>
      usersApi.update(id, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id) => usersApi.delete(id).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useRefreshUsers = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Add minimum delay to ensure refresh UI is visible
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.refetchQueries({
          queryKey: ["users"],
          type: "active",
          exact: false,
        }),
        new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms delay
      ]);
    } catch (error) {
      console.error("Error refreshing users:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  return { refresh, isRefreshing };
};
