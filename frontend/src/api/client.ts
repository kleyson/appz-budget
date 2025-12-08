import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
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
  MonthCloseResponse,
  PayExpenseRequest,
  SummaryTotals,
  PeriodSummaryResponse,
  MonthlyTrendsResponse,
  BackupListResponse,
  BackupDownloadUrlResponse,
  BackupCreateResponse,
  UserRegister,
  UserLogin,
  TokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  User,
} from '../types';

// Use relative URL in production (frontend served from backend), absolute URL in development
// Vite sets MODE to 'production' during build
const API_BASE_URL = import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000';

// Get API key from runtime config (injected by backend) or fallback to build-time env var
// In production, the backend injects window.APP_CONFIG.API_KEY at runtime
// In development, we can use VITE_API_KEY from build-time
const getApiKey = (): string => {
  // Check for runtime config first (injected by backend)
  if (typeof window !== 'undefined' && window.APP_CONFIG?.API_KEY) {
    return window.APP_CONFIG.API_KEY;
  }
  // Fallback to build-time env var (for development)
  return import.meta.env.VITE_API_KEY || '';
};

import { APP_VERSION } from '../utils/version';

const API_KEY = getApiKey();
const CLIENT_PLATFORM = import.meta.env.VITE_CLIENT_PLATFORM || 'Web';
const CLIENT_VERSION = APP_VERSION;
const CLIENT_INFO = `${CLIENT_PLATFORM}/${CLIENT_VERSION}`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'X-Client-Info': CLIENT_INFO,
  },
});

// Token storage key
const TOKEN_STORAGE_KEY = 'appz_budget_token';

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

// Add request interceptor to include JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
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

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't trigger logout handler for login endpoint failures
      const isLoginEndpoint = error.config?.url?.includes('/api/v1/auth/login');
      if (!isLoginEndpoint) {
        // Token expired or invalid, remove it
        removeToken();
        // Trigger logout with message
        if (logoutHandler) {
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
    apiClient.get<Expense[]>('/api/v1/expenses', { params }),
  getById: (id: number): Promise<AxiosResponse<Expense>> =>
    apiClient.get<Expense>(`/api/v1/expenses/${id}`),
  create: (data: ExpenseCreate): Promise<AxiosResponse<Expense>> =>
    apiClient.post<Expense>('/api/v1/expenses', data),
  update: (id: number, data: ExpenseUpdate): Promise<AxiosResponse<Expense>> =>
    apiClient.put<Expense>(`/api/v1/expenses/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> => apiClient.delete(`/api/v1/expenses/${id}`),
  reorder: (expenseIds: number[]): Promise<AxiosResponse<Expense[]>> =>
    apiClient.post<Expense[]>('/api/v1/expenses/reorder', { expense_ids: expenseIds }),
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
  pay: (id: number, data?: PayExpenseRequest): Promise<AxiosResponse<Expense>> =>
    apiClient.post<Expense>(`/api/v1/expenses/${id}/pay`, data || {}),
};

// Category endpoints
export const categoriesApi = {
  getAll: (): Promise<AxiosResponse<Category[]>> => apiClient.get<Category[]>('/api/v1/categories'),
  getById: (id: number): Promise<AxiosResponse<Category>> =>
    apiClient.get<Category>(`/api/v1/categories/${id}`),
  create: (data: CategoryCreate): Promise<AxiosResponse<Category>> =>
    apiClient.post<Category>('/api/v1/categories', data),
  update: (id: number, data: CategoryUpdate): Promise<AxiosResponse<Category>> =>
    apiClient.put<Category>(`/api/v1/categories/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/categories/${id}`),
  getSummary: (params?: { month_id?: number | null }): Promise<AxiosResponse<CategorySummary[]>> =>
    apiClient.get<CategorySummary[]>('/api/v1/categories/summary', {
      params: params ? { month_id: params.month_id } : {},
    }),
};

// Period endpoints
export const periodsApi = {
  getAll: (): Promise<AxiosResponse<Period[]>> => apiClient.get<Period[]>('/api/v1/periods'),
  getById: (id: number): Promise<AxiosResponse<Period>> =>
    apiClient.get<Period>(`/api/v1/periods/${id}`),
  create: (data: PeriodCreate): Promise<AxiosResponse<Period>> =>
    apiClient.post<Period>('/api/v1/periods', data),
  update: (id: number, data: PeriodUpdate): Promise<AxiosResponse<Period>> =>
    apiClient.put<Period>(`/api/v1/periods/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> => apiClient.delete(`/api/v1/periods/${id}`),
};

// Month endpoints
export const monthsApi = {
  getAll: (): Promise<AxiosResponse<Month[]>> => apiClient.get<Month[]>('/api/v1/months'),
  getById: (id: number): Promise<AxiosResponse<Month>> =>
    apiClient.get<Month>(`/api/v1/months/${id}`),
  getCurrent: (): Promise<AxiosResponse<Month>> => apiClient.get<Month>('/api/v1/months/current'),
  getByYearMonth: (year: number, month: number): Promise<AxiosResponse<Month>> =>
    apiClient.get<Month>(`/api/v1/months/year/${year}/month/${month}`),
  create: (data: MonthCreate): Promise<AxiosResponse<Month>> =>
    apiClient.post<Month>('/api/v1/months', data),
  update: (id: number, data: MonthUpdate): Promise<AxiosResponse<Month>> =>
    apiClient.put<Month>(`/api/v1/months/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> => apiClient.delete(`/api/v1/months/${id}`),
  close: (id: number): Promise<AxiosResponse<MonthCloseResponse>> =>
    apiClient.post<MonthCloseResponse>(`/api/v1/months/${id}/close`),
  open: (id: number): Promise<AxiosResponse<MonthCloseResponse>> =>
    apiClient.post<MonthCloseResponse>(`/api/v1/months/${id}/open`),
};

// Income Type endpoints
export const incomeTypesApi = {
  getAll: (): Promise<AxiosResponse<IncomeType[]>> =>
    apiClient.get<IncomeType[]>('/api/v1/income-types'),
  getById: (id: number): Promise<AxiosResponse<IncomeType>> =>
    apiClient.get<IncomeType>(`/api/v1/income-types/${id}`),
  create: (data: IncomeTypeCreate): Promise<AxiosResponse<IncomeType>> =>
    apiClient.post<IncomeType>('/api/v1/income-types', data),
  update: (id: number, data: IncomeTypeUpdate): Promise<AxiosResponse<IncomeType>> =>
    apiClient.put<IncomeType>(`/api/v1/income-types/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> =>
    apiClient.delete(`/api/v1/income-types/${id}`),
  getSummary: (params?: {
    period?: string | null;
    month_id?: number | null;
  }): Promise<AxiosResponse<IncomeTypeSummary[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.month_id) queryParams.append('month_id', params.month_id.toString());
    const queryString = queryParams.toString();
    return apiClient.get<IncomeTypeSummary[]>(
      `/api/v1/income-types/summary${queryString ? `?${queryString}` : ''}`
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
    if (params?.period) queryParams.append('period', params.period);
    if (params?.income_type_id)
      queryParams.append('income_type_id', params.income_type_id.toString());
    if (params?.month_id) queryParams.append('month_id', params.month_id.toString());
    const queryString = queryParams.toString();
    return apiClient.get<Income[]>(`/api/v1/incomes${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id: number): Promise<AxiosResponse<Income>> =>
    apiClient.get<Income>(`/api/v1/incomes/${id}`),
  create: (data: IncomeCreate): Promise<AxiosResponse<Income>> =>
    apiClient.post<Income>('/api/v1/incomes', data),
  update: (id: number, data: IncomeUpdate): Promise<AxiosResponse<Income>> =>
    apiClient.put<Income>(`/api/v1/incomes/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<void>> => apiClient.delete(`/api/v1/incomes/${id}`),
};

// Summary endpoints
export const summaryApi = {
  getTotals: (params?: {
    period?: string | null;
    month_id?: number | null;
  }): Promise<AxiosResponse<SummaryTotals>> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.month_id) queryParams.append('month_id', params.month_id.toString());
    const queryString = queryParams.toString();
    return apiClient.get<SummaryTotals>(
      `/api/v1/summary/totals${queryString ? `?${queryString}` : ''}`
    );
  },
  getByPeriod: (params?: {
    month_id?: number | null;
  }): Promise<AxiosResponse<PeriodSummaryResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.month_id) queryParams.append('month_id', params.month_id.toString());
    const queryString = queryParams.toString();
    return apiClient.get<PeriodSummaryResponse>(
      `/api/v1/summary/by-period${queryString ? `?${queryString}` : ''}`
    );
  },
  getMonthlyTrends: (params?: {
    num_months?: number;
  }): Promise<AxiosResponse<MonthlyTrendsResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.num_months) queryParams.append('num_months', params.num_months.toString());
    const queryString = queryParams.toString();
    return apiClient.get<MonthlyTrendsResponse>(
      `/api/v1/summary/monthly-trends${queryString ? `?${queryString}` : ''}`
    );
  },
};

// Import endpoint
export const importApi = {
  importExcel: (
    file: File,
    monthId: number | null
  ): Promise<AxiosResponse<{ message: string; imported: number }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const url = monthId ? `/api/v1/import/excel?month_id=${monthId}` : '/api/v1/import/excel';
    return apiClient.post<{ message: string; imported: number }>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Auth endpoints
export const authApi = {
  register: (data: UserRegister): Promise<AxiosResponse<User>> =>
    apiClient.post<User>('/api/v1/auth/register', data),
  login: (data: UserLogin): Promise<AxiosResponse<TokenResponse>> =>
    apiClient.post<TokenResponse>('/api/v1/auth/login', data),
  forgotPassword: (data: ForgotPasswordRequest): Promise<AxiosResponse<ForgotPasswordResponse>> =>
    apiClient.post<ForgotPasswordResponse>('/api/v1/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordRequest): Promise<AxiosResponse<ResetPasswordResponse>> =>
    apiClient.post<ResetPasswordResponse>('/api/v1/auth/reset-password', data),
  changePassword: (data: ChangePasswordRequest): Promise<AxiosResponse<ChangePasswordResponse>> =>
    apiClient.post<ChangePasswordResponse>('/api/v1/auth/change-password', data),
  getMe: (): Promise<AxiosResponse<User>> => apiClient.get<User>('/api/v1/auth/me'),
};

// User management endpoints (admin only)
export const usersApi = {
  getAll: (): Promise<AxiosResponse<User[]>> => apiClient.get<User[]>('/api/v1/auth/users'),
  getById: (id: number): Promise<AxiosResponse<User>> =>
    apiClient.get<User>(`/api/v1/auth/users/${id}`),
  create: (data: UserRegister & { is_active?: boolean }): Promise<AxiosResponse<User>> =>
    apiClient.post<User>('/api/v1/auth/users', data),
  update: (
    id: number,
    data: Partial<User> & { is_active?: boolean }
  ): Promise<AxiosResponse<User>> => apiClient.put<User>(`/api/v1/auth/users/${id}`, data),
  delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.delete(`/api/v1/auth/users/${id}`),
};

// Backup endpoints (admin only)
export const backupsApi = {
  getAll: (): Promise<AxiosResponse<BackupListResponse>> =>
    apiClient.get<BackupListResponse>('/api/v1/backups'),
  create: (): Promise<AxiosResponse<BackupCreateResponse>> =>
    apiClient.post<BackupCreateResponse>('/api/v1/backups/create'),
  getDownloadUrl: (filename: string): Promise<AxiosResponse<BackupDownloadUrlResponse>> =>
    apiClient.get<BackupDownloadUrlResponse>(`/api/v1/backups/${filename}/download-url`),
  delete: (filename: string): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.delete(`/api/v1/backups/${filename}`),
};
