import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import {
  authApi,
  removeToken,
  setToken,
  setLogoutHandler,
} from "../api/client";
import { removeBiometricCredentials } from "../utils/biometric";
import type { User, UserLogin } from "../types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: UserLogin, skipCheckAuth?: boolean) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    // For financial apps, always require authentication - never auto-login
    // Always start at login screen, even if a token exists
    // The token will be validated when user authenticates (biometric or password)
    setIsLoading(false);
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: UserLogin, _skipCheckAuth = false) => {
    const response = await authApi.login(credentials);
    await setToken(response.data.access_token);
    // Fetch full user details (which includes is_admin)
    // Always fetch user directly after login to set authenticated state
    try {
      const userResponse = await authApi.getMe();
      setUser(userResponse.data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await removeToken();
    await removeBiometricCredentials();
    setUser(null);
    router.replace("/(auth)/login");
  };

  // Register logout handler for 401 errors
  useEffect(() => {
    const handle401Logout = () => {
      // Only show alert if user is authenticated (to avoid loops)
      if (user) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          [{ text: "OK", onPress: () => logout() }]
        );
      } else {
        // If not authenticated, just logout silently
        logout();
      }
    };

    setLogoutHandler(handle401Logout);

    return () => {
      setLogoutHandler(() => {});
    };
  }, [user]);

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
