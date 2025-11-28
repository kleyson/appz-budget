import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  Income,
  IncomeCreate,
  IncomeUpdate,
  IncomeType,
  IncomeTypeCreate,
  IncomeTypeUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
  Period,
  PeriodCreate,
  PeriodUpdate,
  CategorySummary,
  IncomeTypeSummary,
  Month,
  MonthCreate,
  MonthUpdate,
  SummaryTotals,
  PeriodSummaryResponse,
  UserRegister,
  UserLogin,
  TokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  User,
} from "../types";

// API base URL - will be set dynamically from AsyncStorage
let API_BASE_URL = "";
// Default API key for development mode
const DEFAULT_API_KEY = "your-secret-api-key-change-this";
let API_KEY = DEFAULT_API_KEY;
const CLIENT_PLATFORM = "Mobile";
const CLIENT_VERSION = "1.0.0";
const CLIENT_INFO = `${CLIENT_PLATFORM}/${CLIENT_VERSION}`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    "X-Client-Info": CLIENT_INFO,
  },
});

// Function to update the API base URL
export const updateApiBaseUrl = (url: string) => {
  API_BASE_URL = url;
  apiClient.defaults.baseURL = url;
};

// Function to update the API key
export const updateApiKey = (key: string) => {
  API_KEY = key;
  apiClient.defaults.headers["X-API-Key"] = key;
};

// Default API URL
const DEFAULT_API_URL = "https://budget.appz.wtf";

// Initialize API config from storage on app start
Promise.all([
  AsyncStorage.getItem("appz_budget_api_url"),
  AsyncStorage.getItem("appz_budget_api_key"),
]).then(([storedUrl, storedKey]) => {
  // Use default URL if no URL is stored
  const urlToUse = storedUrl || DEFAULT_API_URL;
  updateApiBaseUrl(urlToUse);
  if (storedKey) {
    updateApiKey(storedKey);
  } else if (DEFAULT_API_KEY) {
    // Use default API key in dev mode if no key is stored
    updateApiKey(DEFAULT_API_KEY);
  }
});

// Token storage key
const TOKEN_STORAGE_KEY = "appz_budget_token";

// Get token from AsyncStorage
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

// Set token in AsyncStorage
export const setToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.error("Error setting token:", error);
  }
};

// Remove token from AsyncStorage
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Logout handler - will be set by AuthContext
let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

// Add response interceptor to handle 401 and 403 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403) {
      // 403 Forbidden - API key missing or invalid
      // Don't trigger logout, just let the error propagate
      // The UI should handle this appropriately (e.g., show API config screen)
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || "";
      // Don't trigger logout for auth endpoints (login, forgot-password, reset-password)
      // These endpoints can legitimately return 401 for invalid credentials
      const isAuthEndpoint =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/forgot-password") ||
        requestUrl.includes("/auth/reset-password");

      if (!isAuthEndpoint) {
        // Token expired or invalid, remove it
        await removeToken();
        // Trigger logout with message only if we have a token (to avoid loops)
        const token = await getToken();
        if (token && logoutHandler) {
          logoutHandler();
        }
      }
    }
    return Promise.reject(error);
  }
);

interface ExpenseFilters {
  period?: string | null;
  category?: string | null;
  month_id?: number | null;
}

// Expense endpoints
export const expensesApi = {
  getAll: (params: ExpenseFilters = {}): Promise<AxiosResponse<Expense[]>> =>
    apiClient.get<Expense[]>("/api/v1/expenses", { params }),
  getById: (id: number): Promise<AxiosResponse<Expense>> =>
    apiClient.get<Expense>(`/api/v1/expenses/${id}`),
  create: (data: ExpenseCreate): Promise<AxiosResponse<Expense>> =>
    apiClient.post<Expense>("/api/v1/expenses", data),
  update: (id: number, data: ExpenseUpdate): Promise<AxiosResponse<Expense>> =>
    apiClient.put<Expense>(`/api/v1/expenses/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/expenses/${id}`),
  cloneToNextMonth: (
    monthId: number
  ): Promise<
    AxiosResponse<{
      message: string;
      cloned_count: number;
      cloned_income_count: number;
      next_month_id: number;
      next_month_name: string;
    }>
  > =>
    apiClient.post<{
      message: string;
      cloned_count: number;
      cloned_income_count: number;
      next_month_id: number;
      next_month_name: string;
    }>(`/api/v1/expenses/clone-to-next-month/${monthId}`),
};

// Category endpoints
export const categoriesApi = {
  getAll: (): Promise<AxiosResponse<Category[]>> =>
    apiClient.get<Category[]>("/api/v1/categories"),
  getById: (id: number): Promise<AxiosResponse<Category>> =>
    apiClient.get<Category>(`/api/v1/categories/${id}`),
  create: (data: CategoryCreate): Promise<AxiosResponse<Category>> =>
    apiClient.post<Category>("/api/v1/categories", data),
  update: (
    id: number,
    data: CategoryUpdate
  ): Promise<AxiosResponse<Category>> =>
    apiClient.put<Category>(`/api/v1/categories/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/categories/${id}`),
  getSummary: (
    period: string | null = null
  ): Promise<AxiosResponse<CategorySummary[]>> =>
    apiClient.get<CategorySummary[]>("/api/v1/categories/summary", {
      params: period ? { period } : {},
    }),
};

// Period endpoints
export const periodsApi = {
  getAll: (): Promise<AxiosResponse<Period[]>> =>
    apiClient.get<Period[]>("/api/v1/periods"),
  getById: (id: number): Promise<AxiosResponse<Period>> =>
    apiClient.get<Period>(`/api/v1/periods/${id}`),
  create: (data: PeriodCreate): Promise<AxiosResponse<Period>> =>
    apiClient.post<Period>("/api/v1/periods", data),
  update: (id: number, data: PeriodUpdate): Promise<AxiosResponse<Period>> =>
    apiClient.put<Period>(`/api/v1/periods/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/periods/${id}`),
};

// Month endpoints
export const monthsApi = {
  getAll: (): Promise<AxiosResponse<Month[]>> =>
    apiClient.get<Month[]>("/api/v1/months"),
  getById: (id: number): Promise<AxiosResponse<Month>> =>
    apiClient.get<Month>(`/api/v1/months/${id}`),
  getCurrent: (): Promise<AxiosResponse<Month>> =>
    apiClient.get<Month>("/api/v1/months/current"),
  getByYearMonth: (
    year: number,
    month: number
  ): Promise<AxiosResponse<Month>> =>
    apiClient.get<Month>(`/api/v1/months/year/${year}/month/${month}`),
  create: (data: MonthCreate): Promise<AxiosResponse<Month>> =>
    apiClient.post<Month>("/api/v1/months", data),
  update: (id: number, data: MonthUpdate): Promise<AxiosResponse<Month>> =>
    apiClient.put<Month>(`/api/v1/months/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/months/${id}`),
};

// Income Type endpoints
export const incomeTypesApi = {
  getAll: (): Promise<AxiosResponse<IncomeType[]>> =>
    apiClient.get<IncomeType[]>("/api/v1/income-types"),
  getById: (id: number): Promise<AxiosResponse<IncomeType>> =>
    apiClient.get<IncomeType>(`/api/v1/income-types/${id}`),
  create: (data: IncomeTypeCreate): Promise<AxiosResponse<IncomeType>> =>
    apiClient.post<IncomeType>("/api/v1/income-types", data),
  update: (
    id: number,
    data: IncomeTypeUpdate
  ): Promise<AxiosResponse<IncomeType>> =>
    apiClient.put<IncomeType>(`/api/v1/income-types/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/income-types/${id}`),
  getSummary: (params?: {
    period?: string | null;
    month_id?: number | null;
  }): Promise<AxiosResponse<IncomeTypeSummary[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.month_id)
      queryParams.append("month_id", params.month_id.toString());
    const queryString = queryParams.toString();
    return apiClient.get<IncomeTypeSummary[]>(
      `/api/v1/income-types/summary${queryString ? `?${queryString}` : ""}`
    );
  },
};

// Income endpoints
export const incomesApi = {
  getAll: (params?: {
    period?: string | null;
    income_type_id?: number | null;
    month_id?: number | null;
  }): Promise<AxiosResponse<Income[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.income_type_id)
      queryParams.append("income_type_id", params.income_type_id.toString());
    if (params?.month_id)
      queryParams.append("month_id", params.month_id.toString());
    const queryString = queryParams.toString();
    return apiClient.get<Income[]>(
      `/api/v1/incomes${queryString ? `?${queryString}` : ""}`
    );
  },
  getById: (id: number): Promise<AxiosResponse<Income>> =>
    apiClient.get<Income>(`/api/v1/incomes/${id}`),
  create: (data: IncomeCreate): Promise<AxiosResponse<Income>> =>
    apiClient.post<Income>("/api/v1/incomes", data),
  update: (id: number, data: IncomeUpdate): Promise<AxiosResponse<Income>> =>
    apiClient.put<Income>(`/api/v1/incomes/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/incomes/${id}`),
};

// Summary endpoints
export const summaryApi = {
  getTotals: (params?: {
    period?: string | null;
    month_id?: number | null;
  }): Promise<AxiosResponse<SummaryTotals>> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.month_id)
      queryParams.append("month_id", params.month_id.toString());
    const queryString = queryParams.toString();
    return apiClient.get<SummaryTotals>(
      `/api/v1/summary/totals${queryString ? `?${queryString}` : ""}`
    );
  },
  getByPeriod: (params?: {
    month_id?: number | null;
  }): Promise<AxiosResponse<PeriodSummaryResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.month_id)
      queryParams.append("month_id", params.month_id.toString());
    const queryString = queryParams.toString();
    return apiClient.get<PeriodSummaryResponse>(
      `/api/v1/summary/by-period${queryString ? `?${queryString}` : ""}`
    );
  },
};

// Auth endpoints
export const authApi = {
  login: (data: UserLogin): Promise<AxiosResponse<TokenResponse>> =>
    apiClient.post<TokenResponse>("/api/v1/auth/login", data),
  forgotPassword: (
    data: ForgotPasswordRequest
  ): Promise<AxiosResponse<ForgotPasswordResponse>> =>
    apiClient.post<ForgotPasswordResponse>(
      "/api/v1/auth/forgot-password",
      data
    ),
  resetPassword: (
    data: ResetPasswordRequest
  ): Promise<AxiosResponse<ResetPasswordResponse>> =>
    apiClient.post<ResetPasswordResponse>("/api/v1/auth/reset-password", data),
  changePassword: (data: {
    current_password: string;
    new_password: string;
  }): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.post<{ message: string }>("/api/v1/auth/change-password", data),
  getMe: (): Promise<AxiosResponse<User>> =>
    apiClient.get<User>("/api/v1/auth/me"),
};

// User management endpoints (admin only)
export const usersApi = {
  getAll: (): Promise<AxiosResponse<User[]>> =>
    apiClient.get<User[]>("/api/v1/auth/users"),
  getById: (id: number): Promise<AxiosResponse<User>> =>
    apiClient.get<User>(`/api/v1/auth/users/${id}`),
  create: (
    data: UserRegister & { is_active?: boolean }
  ): Promise<AxiosResponse<User>> =>
    apiClient.post<User>("/api/v1/auth/users", data),
  update: (
    id: number,
    data: Partial<User> & { is_active?: boolean }
  ): Promise<AxiosResponse<User>> =>
    apiClient.put<User>(`/api/v1/auth/users/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.delete(`/api/v1/auth/users/${id}`),
};
