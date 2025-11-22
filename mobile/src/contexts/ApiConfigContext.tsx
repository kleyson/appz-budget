import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL_STORAGE_KEY = "appz_budget_api_url";
const API_KEY_STORAGE_KEY = "appz_budget_api_key";
const DEFAULT_API_URL = "https://budget.appz.wtf";

interface ApiConfigContextType {
  apiUrl: string | null;
  apiKey: string | null;
  isLoading: boolean;
  setApiUrl: (url: string) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  clearApiUrl: () => Promise<void>;
  clearApiKey: () => Promise<void>;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(
  undefined
);

export const useApiConfig = (): ApiConfigContextType => {
  const context = useContext(ApiConfigContext);
  if (!context) {
    throw new Error("useApiConfig must be used within ApiConfigProvider");
  }
  return context;
};

interface ApiConfigProviderProps {
  children: ReactNode;
}

export const ApiConfigProvider = ({ children }: ApiConfigProviderProps) => {
  const [apiUrl, setApiUrlState] = useState<string | null>(null);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApiConfig();
  }, []);

  const loadApiConfig = async () => {
    try {
      const [storedUrl, storedKey] = await Promise.all([
        AsyncStorage.getItem(API_URL_STORAGE_KEY),
        AsyncStorage.getItem(API_KEY_STORAGE_KEY),
      ]);
      // Use default URL if no URL is stored
      const urlToUse = storedUrl || DEFAULT_API_URL;
      setApiUrlState(urlToUse);
      // Update API client with the URL (default or stored)
      if (urlToUse) {
        const { updateApiBaseUrl } = await import("../api/client");
        updateApiBaseUrl(urlToUse);
      }
      // Use default API key in dev mode if no key is stored
      const defaultKey = __DEV__ ? "your-secret-api-key-change-this" : null;
      setApiKeyState(storedKey || defaultKey);
    } catch (error) {
      console.error("Error loading API config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setApiUrl = async (url: string) => {
    try {
      // Validate URL format
      const trimmedUrl = url.trim();
      if (trimmedUrl) {
        // Remove trailing slash
        const cleanUrl = trimmedUrl.replace(/\/+$/, "");
        await AsyncStorage.setItem(API_URL_STORAGE_KEY, cleanUrl);
        setApiUrlState(cleanUrl);
        // Update API client immediately
        const { updateApiBaseUrl } = await import("../api/client");
        updateApiBaseUrl(cleanUrl);
      }
    } catch (error) {
      console.error("Error saving API URL:", error);
      throw error;
    }
  };

  const setApiKey = async (key: string) => {
    try {
      const trimmedKey = key.trim();
      await AsyncStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
      setApiKeyState(trimmedKey);
      // Update API client immediately
      const { updateApiKey } = await import("../api/client");
      updateApiKey(trimmedKey);
    } catch (error) {
      console.error("Error saving API key:", error);
      throw error;
    }
  };

  const clearApiUrl = async () => {
    try {
      await AsyncStorage.removeItem(API_URL_STORAGE_KEY);
      setApiUrlState(null);
    } catch (error) {
      console.error("Error clearing API URL:", error);
      throw error;
    }
  };

  const clearApiKey = async () => {
    try {
      await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
      setApiKeyState(null);
      const { updateApiKey } = await import("../api/client");
      updateApiKey("");
    } catch (error) {
      console.error("Error clearing API key:", error);
      throw error;
    }
  };

  return (
    <ApiConfigContext.Provider
      value={{
        apiUrl,
        apiKey,
        isLoading,
        setApiUrl,
        setApiKey,
        clearApiUrl,
        clearApiKey,
      }}
    >
      {children}
    </ApiConfigContext.Provider>
  );
};
