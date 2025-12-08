import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../useUsers';
import { usersApi } from '../../api/client';
import type { User, UserRegister } from '../../types';

// Mock the API client
vi.mock('../../api/client', () => ({
  usersApi: {
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

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch users successfully', async () => {
    const mockUsers: User[] = [
      {
        id: 1,
        email: 'user1@example.com',
        full_name: 'User One',
        is_active: true,
        is_admin: false,
      },
      {
        id: 2,
        email: 'user2@example.com',
        full_name: 'User Two',
        is_active: false,
        is_admin: false,
      },
    ];

    vi.mocked(usersApi.getAll).mockResolvedValue({
      data: mockUsers,
    } as any);

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUsers);
    expect(usersApi.getAll).toHaveBeenCalledOnce();
  });

  it('should handle error when fetching users', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(usersApi.getAll).mockRejectedValue(error);

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useCreateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create user successfully', async () => {
    const newUser: UserRegister & { is_active?: boolean } = {
      email: 'newuser@example.com',
      password: 'securepassword123',
      full_name: 'New User',
      is_active: true,
    };

    const createdUser: User = {
      id: 3,
      email: 'newuser@example.com',
      full_name: 'New User',
      is_active: true,
      is_admin: false,
    };

    vi.mocked(usersApi.create).mockResolvedValue({
      data: createdUser,
    } as any);

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newUser);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(createdUser);
    expect(usersApi.create).toHaveBeenCalledWith(newUser);
  });

  it('should handle error when creating user', async () => {
    const newUser: UserRegister & { is_active?: boolean } = {
      email: 'newuser@example.com',
      password: 'securepassword123',
    };

    const error = new Error('Failed to create');
    vi.mocked(usersApi.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newUser);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useUpdateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update user successfully', async () => {
    const updateData: Partial<User> & { is_active?: boolean } = {
      email: 'updated@example.com',
      full_name: 'Updated Name',
      is_active: false,
    };

    const updatedUser: User = {
      id: 1,
      email: 'updated@example.com',
      full_name: 'Updated Name',
      is_active: false,
      is_admin: false,
    };

    vi.mocked(usersApi.update).mockResolvedValue({
      data: updatedUser,
    } as any);

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedUser);
    expect(usersApi.update).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle partial update', async () => {
    const updateData: Partial<User> & { is_active?: boolean } = {
      full_name: 'Only Name Updated',
    };

    const updatedUser: User = {
      id: 1,
      email: 'user1@example.com',
      full_name: 'Only Name Updated',
      is_active: true,
      is_admin: false,
    };

    vi.mocked(usersApi.update).mockResolvedValue({
      data: updatedUser,
    } as any);

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedUser);
    expect(usersApi.update).toHaveBeenCalledWith(1, updateData);
  });

  it('should handle error when updating user', async () => {
    const updateData: Partial<User> & { is_active?: boolean } = {
      email: 'updated@example.com',
    };

    const error = new Error('Failed to update');
    vi.mocked(usersApi.update).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 1, data: updateData });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

describe('useDeleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete user successfully', async () => {
    vi.mocked(usersApi.delete).mockResolvedValue({} as any);

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(usersApi.delete).toHaveBeenCalledWith(1);
  });

  it('should handle error when deleting user', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(usersApi.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });
});

