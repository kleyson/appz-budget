export interface Purchase {
  name: string;
  amount: number;
  date?: string | null; // ISO date string when purchase was made
}

export interface Expense {
  id: number;
  expense_name: string;
  period: string;
  category: string;
  budget: number;
  cost: number;
  notes?: string | null;
  month_id: number;
  purchases?: Purchase[] | null;
  order: number;
  expense_date?: string | null; // ISO date string when expense was added
}

export interface ExpenseCreate {
  expense_name: string;
  period: string;
  category: string;
  budget: number;
  cost: number;
  notes?: string | null;
  month_id: number;
  purchases?: Purchase[] | null;
  expense_date?: string | null;
}

export interface ExpenseUpdate {
  expense_name?: string;
  period?: string;
  category?: string;
  budget?: number;
  cost?: number;
  notes?: string | null;
  month_id?: number;
  purchases?: Purchase[] | null;
  expense_date?: string | null;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface CategoryCreate {
  name: string;
  color?: string;
}

export interface CategoryUpdate {
  name: string;
  color?: string;
}

export interface CategorySummary {
  category: string;
  budget: number;
  total: number;
  over_budget: boolean;
}

export interface IncomeTypeSummary {
  income_type: string;
  budget: number;
  total: number;
}

export interface SummaryTotals {
  total_budgeted_expenses: number;
  total_current_expenses: number;
  total_budgeted_income: number;
  total_current_income: number;
  total_budgeted: number;
  total_current: number;
}

export interface PeriodSummary {
  period: string;
  color: string;
  total_income: number;
  total_expenses: number;
  difference: number;
}

export interface PeriodSummaryResponse {
  periods: PeriodSummary[];
  grand_total_income: number;
  grand_total_expenses: number;
  grand_total_difference: number;
}

export interface Period {
  id: number;
  name: string;
  color: string;
}

export interface PeriodCreate {
  name: string;
  color?: string;
}

export interface PeriodUpdate {
  name: string;
  color?: string;
}

export interface ExpenseFilters {
  period?: string | null;
  category?: string | null;
  month_id?: number | null;
}

export interface Month {
  id: number;
  year: number;
  month: number; // 1-12
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  closed_at?: string | null;
  closed_by?: string | null;
}

export interface MonthCreate {
  year: number;
  month: number; // 1-12
}

export interface MonthUpdate {
  year?: number;
  month?: number;
  name?: string;
  start_date?: string;
  end_date?: string;
}

export type Theme = 'light' | 'dark';

// Auth types
export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_admin: boolean;
}

export interface UserRegister {
  email: string;
  password: string;
  full_name?: string | null;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  token?: string | null;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface IncomeType {
  id: number;
  name: string;
  color: string;
}

export interface IncomeTypeCreate {
  name: string;
  color?: string;
}

export interface IncomeTypeUpdate {
  name: string;
  color?: string;
}

export interface Income {
  id: number;
  income_type_id: number;
  period: string;
  budget: number;
  amount: number;
  month_id: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface IncomeCreate {
  income_type_id: number;
  period: string;
  budget: number;
  amount: number;
  month_id: number;
}

export interface IncomeUpdate {
  income_type_id?: number;
  period?: string;
  budget?: number;
  amount?: number;
  month_id?: number;
}

export interface PayExpenseRequest {
  amount?: number | null; // If not provided, uses budget amount
}

export interface MonthCloseResponse {
  id: number;
  name: string;
  is_closed: boolean;
  closed_at?: string | null;
  closed_by?: string | null;
  message: string;
}
