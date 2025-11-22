import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, getToken, removeToken, setToken, setLogoutHandler } from '../api/client';
import { useDialog } from './DialogContext';
import type { User, UserLogin } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showAlert } = useDialog();

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      setUser(response.data);
    } catch (error) {
      // Token invalid or expired
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: UserLogin) => {
    const response = await authApi.login(credentials);
    setToken(response.data.access_token);
    // Fetch full user details (which includes is_admin)
    await checkAuth();
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  // Register logout handler for 401 errors
  useEffect(() => {
    setLogoutHandler(async () => {
      await showAlert({
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        type: 'warning',
        confirmText: 'OK',
      });
      logout();
    });

    return () => {
      setLogoutHandler(() => {});
    };
  }, [showAlert]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
