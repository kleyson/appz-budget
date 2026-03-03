/**
 * Zod validation schemas for all request/response validation.
 * Ported from backend-python-archive/schemas.py.
 */

import { z } from 'zod';

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  full_name: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(1),
});

export const adminSetPasswordSchema = z.object({
  new_password: z.string().min(1),
});

export const generateResetLinkSchema = z.object({
  user_id: z.number().int().positive(),
});

export const userCreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  full_name: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  is_admin: z.boolean().optional().default(false),
});

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().optional(),
  is_active: z.boolean().optional(),
  is_admin: z.boolean().optional(),
});

// ─── Purchase Schema ─────────────────────────────────────────────────────────

export const purchaseSchema = z.object({
  name: z.string().min(1),
  amount: z.number(),
  date: z.string().optional(),
});

// ─── Expense Schemas ─────────────────────────────────────────────────────────

export const expenseCreateSchema = z.object({
  expense_name: z.string().min(1),
  period: z.string().min(1),
  category: z.string().min(1),
  budget: z.number().default(0),
  cost: z.number().default(0),
  notes: z.string().optional(),
  month_id: z.number().int().positive(),
  purchases: z.array(purchaseSchema).optional(),
  order: z.number().int().default(0),
  expense_date: z.string().optional(),
});

export const expenseUpdateSchema = z.object({
  expense_name: z.string().min(1).optional(),
  period: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  budget: z.number().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
  month_id: z.number().int().positive().optional(),
  purchases: z.array(purchaseSchema).optional(),
  order: z.number().int().optional(),
  expense_date: z.string().optional(),
});

export const expenseReorderSchema = z.object({
  expense_ids: z.array(z.number().int().positive()),
});

export const payExpenseSchema = z.object({
  amount: z.number().optional(),
  name: z.string().optional(),
});

// ─── Income Schemas ──────────────────────────────────────────────────────────

export const incomeCreateSchema = z.object({
  income_type_id: z.number().int().positive(),
  period: z.string().min(1),
  budget: z.number().default(0),
  amount: z.number().default(0),
  month_id: z.number().int().positive(),
});

export const incomeUpdateSchema = z.object({
  income_type_id: z.number().int().positive().optional(),
  period: z.string().min(1).optional(),
  budget: z.number().optional(),
  amount: z.number().optional(),
  month_id: z.number().int().positive().optional(),
});

// ─── Category Schemas ────────────────────────────────────────────────────────

export const categoryCreateSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

// ─── Period Schemas ──────────────────────────────────────────────────────────

export const periodCreateSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export const periodUpdateSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

// ─── Income Type Schemas ─────────────────────────────────────────────────────

export const incomeTypeCreateSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

export const incomeTypeUpdateSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

// ─── Month Schemas ───────────────────────────────────────────────────────────

export const monthCreateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export const monthUpdateSchema = z.object({
  year: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  name: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

// ─── Summary Insights Schemas ───────────────────────────────────────────────

export const insightSchema = z.object({
  type: z.enum(['warning', 'positive', 'neutral']),
  icon: z.string(),
  message: z.string(),
  category: z.string().optional(),
});

export const summaryInsightsSchema = z.object({
  insights: z.array(insightSchema),
  savings_projection: z.number(),
  budget_health: z.enum(['good', 'warning', 'critical']),
  over_budget_count: z.number(),
  total_categories: z.number(),
});
