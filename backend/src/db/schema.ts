import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  hashed_password: text('hashed_password').notNull(),
  full_name: text('full_name'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  is_admin: integer('is_admin', { mode: 'boolean' }).default(false),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

// ─── Password Reset Tokens ──────────────────────────────────────────────────

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull(),
  token: text('token').notNull().unique(),
  short_code: text('short_code'),
  expires_at: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).default(false),
  created_at: text('created_at'),
});

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#8b5cf6'),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

// ─── Periods ─────────────────────────────────────────────────────────────────

export const periods = sqliteTable('periods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#8b5cf6'),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

// ─── Income Types ────────────────────────────────────────────────────────────

export const incomeTypes = sqliteTable('income_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#10b981'),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

// ─── Months ──────────────────────────────────────────────────────────────────

export const months = sqliteTable('months', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  name: text('name').notNull().unique(),
  start_date: text('start_date').notNull(),
  end_date: text('end_date').notNull(),
  is_closed: integer('is_closed', { mode: 'boolean' }).default(false),
  closed_at: text('closed_at'),
  closed_by: text('closed_by'),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

// ─── Expenses ────────────────────────────────────────────────────────────────

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  expense_name: text('expense_name').notNull(),
  period: text('period').notNull(),
  category: text('category').notNull(),
  budget: real('budget').default(0),
  cost: real('cost').default(0),
  notes: text('notes'),
  month_id: integer('month_id')
    .notNull()
    .references(() => months.id),
  order: integer('order').default(0),
  purchases: text('purchases'), // JSON stored as text string
  expense_date: text('expense_date'),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

// ─── Incomes ─────────────────────────────────────────────────────────────────

export const incomes = sqliteTable('incomes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  income_type_id: integer('income_type_id')
    .notNull()
    .references(() => incomeTypes.id),
  period: text('period').notNull(),
  budget: real('budget').default(0),
  amount: real('amount').default(0),
  month_id: integer('month_id')
    .notNull()
    .references(() => months.id),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

// ─── Seed Records ────────────────────────────────────────────────────────────

export const seedRecords = sqliteTable('seed_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  seed_id: text('seed_id').notNull().unique(),
  executed_at: text('executed_at').notNull(),
});
