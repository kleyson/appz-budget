# Backend Migration & Summary Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the Python/FastAPI backend to Bun/Hono/Drizzle, rename "budget" to "projected" throughout the app, and add charts + smart insights to the summary UI across all platforms.

**Architecture:** Replace `backend/` in-place with a Hono + Drizzle ORM project on Bun runtime. Add an insights API endpoint. Enhance all three frontends (web, mobile, TUI) with charts and insight cards. The existing SQLite database file is preserved — Drizzle connects to the same DB.

**Tech Stack:** Bun, Hono, Drizzle ORM, Zod, jose (JWT), Recharts (web), Victory Native (mobile), Ratatui widgets (TUI)

---

## Phase 1: Backend Migration — Project Setup

### Task 1: Archive Python backend and initialize Bun project

**Files:**
- Archive: `backend/` → `backend-python-archive/` (temporary, for reference)
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/bunfig.toml`
- Create: `backend/src/index.ts`

**Step 1: Move Python backend to archive**

```bash
mv backend backend-python-archive
mkdir -p backend/src
```

**Step 2: Initialize Bun project**

```bash
cd backend
bun init -y
```

**Step 3: Install dependencies**

```bash
cd backend
bun add hono @hono/zod-validator zod drizzle-orm jose bcrypt nodemailer
bun add -d drizzle-kit @types/better-sqlite3 @types/bcrypt @types/nodemailer typescript
```

**Step 4: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 5: Create minimal `backend/src/index.ts` to verify setup**

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

export default {
  port: parseInt(process.env.PORT || '8000'),
  fetch: app.fetch,
};
```

**Step 6: Run to verify**

Run: `cd backend && bun run src/index.ts`
Expected: Server starts on port 8000, `curl localhost:8000/health` returns `{"status":"ok"}`

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: initialize Bun + Hono backend project, archive Python backend"
```

---

### Task 2: Create Drizzle schema matching existing SQLite database

**Files:**
- Create: `backend/src/db/schema.ts`
- Create: `backend/src/db/connection.ts`
- Create: `backend/drizzle.config.ts`

**Step 1: Create `backend/src/db/schema.ts`**

This must exactly match the existing SQLite database columns. The column names use snake_case to match the existing DB.

```typescript
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  hashed_password: text('hashed_password').notNull(),
  full_name: text('full_name'),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  is_admin: integer('is_admin', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull(),
  token: text('token').notNull().unique(),
  short_code: text('short_code'),
  expires_at: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#8b5cf6'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

export const periods = sqliteTable('periods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#8b5cf6'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

export const incomeTypes = sqliteTable('income_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#10b981'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

export const months = sqliteTable('months', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  name: text('name').notNull().unique(),
  start_date: text('start_date').notNull(),
  end_date: text('end_date').notNull(),
  is_closed: integer('is_closed', { mode: 'boolean' }).notNull().default(false),
  closed_at: text('closed_at'),
  closed_by: text('closed_by'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  expense_name: text('expense_name').notNull(),
  period: text('period').notNull(),
  category: text('category').notNull(),
  budget: real('budget').notNull().default(0),
  cost: real('cost').notNull().default(0),
  notes: text('notes'),
  month_id: integer('month_id').notNull().references(() => months.id),
  order: integer('order').notNull().default(0),
  purchases: text('purchases'),
  expense_date: text('expense_date'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

export const incomes = sqliteTable('incomes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  income_type_id: integer('income_type_id').notNull().references(() => incomeTypes.id),
  period: text('period').notNull(),
  budget: real('budget').notNull().default(0),
  amount: real('amount').notNull().default(0),
  month_id: integer('month_id').notNull().references(() => months.id),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
  created_by: text('created_by'),
  updated_by: text('updated_by'),
});

export const seedRecords = sqliteTable('seed_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  seed_id: text('seed_id').notNull().unique(),
  executed_at: text('executed_at').notNull(),
});
```

**Step 2: Create `backend/src/db/connection.ts`**

```typescript
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

const dbPath = process.env.DATABASE_PATH || './data/budget.db';
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
```

**Step 3: Create `backend/drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './data/budget.db',
  },
});
```

**Step 4: Verify connection works with existing database**

Add a quick test to `src/index.ts`:
```typescript
import { db } from './db/connection';
import { categories } from './db/schema';

// Temporary: verify DB connection
const cats = db.select().from(categories).all();
console.log(`Connected to DB. Found ${cats.length} categories.`);
```

Run: `cd backend && bun run src/index.ts`
Expected: Prints count of existing categories from the database

**Step 5: Remove the temporary verification code**

**Step 6: Commit**

```bash
git add backend/src/db/ backend/drizzle.config.ts
git commit -m "feat: add Drizzle schema and SQLite connection matching existing database"
```

---

### Task 3: Create config and utility modules

**Files:**
- Create: `backend/src/config.ts`
- Create: `backend/src/utils/auth.ts`
- Create: `backend/src/utils/email.ts`
- Create: `backend/src/utils/html-injector.ts`

**Step 1: Create `backend/src/config.ts`**

```typescript
function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  env: env('ENV', 'production'),
  port: parseInt(env('PORT', '8000')),
  apiKey: env('API_KEY', 'dev-api-key'),
  jwt: {
    secret: env('JWT_SECRET_KEY', 'dev-secret-change-in-production'),
    expireMinutes: 30 * 24 * 60, // 30 days
    algorithm: 'HS256' as const,
  },
  database: {
    path: env('DATABASE_PATH', './data/budget.db'),
  },
  smtp: {
    enabled: !!process.env.SMTP_HOST,
    host: env('SMTP_HOST', ''),
    port: parseInt(env('SMTP_PORT', '587')),
    user: env('SMTP_USER', ''),
    password: env('SMTP_PASSWORD', ''),
    from: env('SMTP_FROM', 'noreply@budget.local'),
    useTls: env('SMTP_USE_TLS', 'true') === 'true',
  },
  passwordReset: {
    codeLength: parseInt(env('RESET_CODE_LENGTH', '6')),
    codeExpirationMinutes: parseInt(env('RESET_CODE_EXPIRATION_MINUTES', '30')),
    tokenExpirationHours: parseInt(env('RESET_TOKEN_EXPIRATION_HOURS', '24')),
  },
} as const;

export const isDev = config.env === 'development';
```

**Step 2: Create `backend/src/utils/auth.ts`**

```typescript
import * as jose from 'jose';
import { config } from '../config';

const secret = new TextEncoder().encode(config.jwt.secret);

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

export async function createAccessToken(data: Record<string, unknown>, expiresInMinutes?: number): Promise<string> {
  const minutes = expiresInMinutes ?? config.jwt.expireMinutes;
  return new jose.SignJWT(data)
    .setProtectedHeader({ alg: config.jwt.algorithm })
    .setExpirationTime(`${minutes}m`)
    .setIssuedAt()
    .sign(secret);
}

export async function decodeAccessToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function generateResetToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

export function generateShortCode(length = 6): string {
  const digits = '0123456789';
  let code = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    code += digits[byte % 10];
  }
  return code;
}
```

**Step 3: Create `backend/src/utils/email.ts`**

```typescript
import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.useTls,
      auth: { user: config.smtp.user, pass: config.smtp.password },
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
  shortCode: string,
  expiresMinutes: number,
): Promise<boolean> {
  if (!config.smtp.enabled) return false;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1e293b;">Password Reset Request</h1>
      <p>You requested a password reset. Use the code below or click the link:</p>
      <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${shortCode}</span>
      </div>
      <p><a href="${resetUrl}" style="color: #3b82f6;">Click here to reset your password</a></p>
      <p style="color: #64748b; font-size: 14px;">This code expires in ${expiresMinutes} minutes.</p>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: config.smtp.from,
      to: toEmail,
      subject: 'Password Reset Request',
      html,
      text: `Password Reset Code: ${shortCode}\nLink: ${resetUrl}\nExpires in ${expiresMinutes} minutes.`,
    });
    return true;
  } catch (err) {
    console.error('Failed to send email:', err);
    return false;
  }
}
```

**Step 4: Create `backend/src/utils/html-injector.ts`**

```typescript
import { config } from '../config';

export function injectApiKey(html: string, apiKey?: string): string {
  const key = apiKey ?? config.apiKey;
  const configScript = `<script>window.APP_CONFIG = ${JSON.stringify({ API_KEY: key })};</script>`;
  return html.replace('</head>', `${configScript}\n</head>`);
}
```

**Step 5: Commit**

```bash
git add backend/src/config.ts backend/src/utils/
git commit -m "feat: add config, auth utilities, email sender, and HTML injector"
```

---

### Task 4: Create middleware (API key, JWT, CORS)

**Files:**
- Create: `backend/src/middleware/api-key.ts`
- Create: `backend/src/middleware/jwt.ts`
- Create: `backend/src/middleware/cors.ts`

**Step 1: Create `backend/src/middleware/api-key.ts`**

```typescript
import type { Context, Next } from 'hono';
import { config } from '../config';

export async function apiKeyAuth(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey || apiKey !== config.apiKey) {
    return c.json({ detail: 'Invalid or missing API key' }, 403);
  }
  await next();
}
```

**Step 2: Create `backend/src/middleware/jwt.ts`**

```typescript
import type { Context, Next } from 'hono';
import { decodeAccessToken } from '../utils/auth';
import { db } from '../db/connection';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function jwtAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ detail: 'Missing authentication credentials' }, 401);
  }
  const token = authHeader.slice(7);
  const payload = await decodeAccessToken(token);
  if (!payload || !payload.user_id) {
    return c.json({ detail: 'Invalid or expired token' }, 401);
  }
  c.set('userId', payload.user_id as number);

  // Also extract user name for audit fields
  const user = await db.select({ full_name: users.full_name, email: users.email })
    .from(users).where(eq(users.id, payload.user_id as number)).get();
  if (user) {
    c.set('userName', user.full_name || user.email);
  }
  await next();
}

export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await decodeAccessToken(token);
    if (payload?.user_id) {
      c.set('userId', payload.user_id as number);
    }
  }
  // Also check X-User-Name header as fallback
  const headerName = c.req.header('X-User-Name');
  if (headerName && !c.get('userName')) {
    c.set('userName', headerName);
  }
  await next();
}

export async function adminAuth(c: Context, next: Next) {
  const userId = c.get('userId');
  if (!userId) return c.json({ detail: 'Authentication required' }, 401);

  const user = await db.select({ is_admin: users.is_admin })
    .from(users).where(eq(users.id, userId)).get();
  if (!user?.is_admin) {
    return c.json({ detail: 'Admin access required' }, 403);
  }
  await next();
}
```

**Step 3: Create `backend/src/middleware/cors.ts`**

```typescript
import { cors } from 'hono/cors';
import { isDev } from '../config';

export const corsMiddleware = cors({
  origin: isDev ? ['http://localhost:3000', 'http://localhost:5173'] : '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-User-Name', 'X-Client-Info'],
  credentials: true,
});
```

**Step 4: Commit**

```bash
git add backend/src/middleware/
git commit -m "feat: add API key, JWT, and CORS middleware"
```

---

## Phase 2: Backend Migration — Routes & Services

### Task 5: Implement health and auth routes

**Files:**
- Create: `backend/src/routes/health.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/types/schemas.ts`

**Step 1: Create Zod schemas `backend/src/types/schemas.ts`**

Start with auth-related schemas. This file will grow as we add more routes.

```typescript
import { z } from 'zod';

// Auth
export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ token: z.string(), new_password: z.string().min(6) });
export const changePasswordSchema = z.object({ current_password: z.string(), new_password: z.string().min(6) });
export const adminSetPasswordSchema = z.object({ new_password: z.string().min(6) });
export const generateResetLinkSchema = z.object({ user_id: z.number() });

// Expenses
export const expenseCreateSchema = z.object({
  expense_name: z.string(),
  period: z.string(),
  category: z.string(),
  budget: z.number().default(0),
  cost: z.number().default(0),
  notes: z.string().nullable().optional(),
  month_id: z.number(),
  order: z.number().default(0),
  purchases: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    date: z.string().optional(),
  })).nullable().optional(),
  expense_date: z.string().nullable().optional(),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();
export const expenseReorderSchema = z.object({ expense_ids: z.array(z.number()) });
export const payExpenseSchema = z.object({
  amount: z.number().optional(),
  name: z.string().optional(),
});

// Income
export const incomeCreateSchema = z.object({
  income_type_id: z.number(),
  period: z.string(),
  budget: z.number().default(0),
  amount: z.number().default(0),
  month_id: z.number(),
});

export const incomeUpdateSchema = incomeCreateSchema.partial();

// Categories, Periods, Income Types (simple name+color entities)
export const categoryCreateSchema = z.object({ name: z.string(), color: z.string().optional() });
export const categoryUpdateSchema = z.object({ name: z.string().optional(), color: z.string().optional() });

export const periodCreateSchema = z.object({ name: z.string(), color: z.string().optional() });
export const periodUpdateSchema = z.object({ name: z.string().optional(), color: z.string().optional() });

export const incomeTypeCreateSchema = z.object({ name: z.string(), color: z.string().optional() });
export const incomeTypeUpdateSchema = z.object({ name: z.string().optional(), color: z.string().optional() });

// Months
export const monthCreateSchema = z.object({ year: z.number(), month: z.number().min(1).max(12) });
export const monthUpdateSchema = z.object({
  name: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_closed: z.boolean().optional(),
});
```

**Step 2: Create `backend/src/routes/health.ts`**

```typescript
import { Hono } from 'hono';

const health = new Hono();

health.get('/health', (c) =>
  c.json({ status: 'healthy', timestamp: new Date().toISOString() }),
);

health.get('/api/v1/health', (c) =>
  c.json({ status: 'healthy', timestamp: new Date().toISOString() }),
);

export default health;
```

**Step 3: Create `backend/src/routes/auth.ts`**

Port `backend-python-archive/controllers/auth_controller.py` logic. This is the most complex route file. Full implementation with login, register, password reset, user management.

```typescript
import { Hono } from 'hono';
import { db } from '../db/connection';
import { users, passwordResetTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword, verifyPassword, createAccessToken, generateResetToken, generateShortCode } from '../utils/auth';
import { sendPasswordResetEmail } from '../utils/email';
import { config, isDev } from '../config';
import { jwtAuth, adminAuth } from '../middleware/jwt';
import { apiKeyAuth } from '../middleware/api-key';
import {
  userLoginSchema, userRegisterSchema, forgotPasswordSchema,
  resetPasswordSchema, changePasswordSchema, adminSetPasswordSchema,
  generateResetLinkSchema,
} from '../types/schemas';

const auth = new Hono();

auth.use('/api/v1/auth/*', apiKeyAuth);
auth.use('/api/v1/users/*', apiKeyAuth);

// POST /api/v1/auth/login
auth.post('/api/v1/auth/login', async (c) => {
  const body = userLoginSchema.parse(await c.req.json());
  const user = await db.select().from(users).where(eq(users.email, body.email)).get();
  if (!user || !(await verifyPassword(body.password, user.hashed_password))) {
    return c.json({ detail: 'Invalid email or password' }, 401);
  }
  if (!user.is_active) return c.json({ detail: 'Account is deactivated' }, 403);
  const token = await createAccessToken({ user_id: user.id, email: user.email });
  return c.json({ access_token: token, token_type: 'bearer', user_id: user.id, email: user.email });
});

// POST /api/v1/auth/register
auth.post('/api/v1/auth/register', async (c) => {
  const body = userRegisterSchema.parse(await c.req.json());
  const existing = await db.select().from(users).where(eq(users.email, body.email)).get();
  if (existing) return c.json({ detail: 'Email already registered' }, 409);
  const hashed = await hashPassword(body.password);
  const now = new Date().toISOString();
  const result = db.insert(users).values({
    email: body.email, hashed_password: hashed, full_name: body.full_name || null,
    created_at: now, updated_at: now,
  }).returning().get();
  const token = await createAccessToken({ user_id: result.id, email: result.email });
  return c.json({ access_token: token, token_type: 'bearer', user_id: result.id, email: result.email }, 201);
});

// GET /api/v1/auth/me
auth.get('/api/v1/auth/me', jwtAuth, async (c) => {
  const userId = c.get('userId') as number;
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return c.json({ detail: 'User not found' }, 404);
  const { hashed_password, ...safeUser } = user;
  return c.json(safeUser);
});

// POST /api/v1/auth/forgot-password
auth.post('/api/v1/auth/forgot-password', async (c) => {
  const { email } = forgotPasswordSchema.parse(await c.req.json());
  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return c.json({ message: 'If the email exists, a reset link has been sent', email_sent: false });
  const token = generateResetToken();
  const shortCode = generateShortCode(config.passwordReset.codeLength);
  const expiresAt = new Date(Date.now() + config.passwordReset.codeExpirationMinutes * 60 * 1000).toISOString();
  db.insert(passwordResetTokens).values({
    user_id: user.id, token, short_code: shortCode, expires_at: expiresAt, created_at: new Date().toISOString(),
  }).run();
  const resetUrl = `${c.req.url.split('/api')[0]}/reset-password?token=${token}`;
  const emailSent = await sendPasswordResetEmail(email, resetUrl, shortCode, config.passwordReset.codeExpirationMinutes);
  const response: Record<string, unknown> = { message: 'If the email exists, a reset link has been sent', email_sent: emailSent };
  if (isDev) { response.token = token; response.short_code = shortCode; }
  return c.json(response);
});

// POST /api/v1/auth/reset-password
auth.post('/api/v1/auth/reset-password', async (c) => {
  const { token, new_password } = resetPasswordSchema.parse(await c.req.json());
  const now = new Date().toISOString();
  const resetToken = await db.select().from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.used, false), gt(passwordResetTokens.expires_at, now)))
    .get();
  if (!resetToken) return c.json({ detail: 'Invalid or expired reset token' }, 400);
  const hashed = await hashPassword(new_password);
  db.update(users).set({ hashed_password: hashed, updated_at: now }).where(eq(users.id, resetToken.user_id)).run();
  db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, resetToken.id)).run();
  return c.json({ message: 'Password reset successfully' });
});

// POST /api/v1/auth/change-password
auth.post('/api/v1/auth/change-password', jwtAuth, async (c) => {
  const userId = c.get('userId') as number;
  const { current_password, new_password } = changePasswordSchema.parse(await c.req.json());
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user || !(await verifyPassword(current_password, user.hashed_password))) {
    return c.json({ detail: 'Current password is incorrect' }, 400);
  }
  const hashed = await hashPassword(new_password);
  db.update(users).set({ hashed_password: hashed, updated_at: new Date().toISOString() }).where(eq(users.id, userId)).run();
  return c.json({ message: 'Password changed successfully' });
});

// GET /api/v1/users (admin)
auth.get('/api/v1/users', jwtAuth, adminAuth, async (c) => {
  const allUsers = db.select().from(users).all();
  return c.json(allUsers.map(({ hashed_password, ...u }) => u));
});

// POST /api/v1/users (admin create)
auth.post('/api/v1/users', jwtAuth, adminAuth, async (c) => {
  const body = userRegisterSchema.parse(await c.req.json());
  const existing = await db.select().from(users).where(eq(users.email, body.email)).get();
  if (existing) return c.json({ detail: 'Email already registered' }, 409);
  const hashed = await hashPassword(body.password);
  const now = new Date().toISOString();
  const result = db.insert(users).values({
    email: body.email, hashed_password: hashed, full_name: body.full_name || null,
    created_at: now, updated_at: now,
  }).returning().get();
  const { hashed_password, ...safeUser } = result;
  return c.json(safeUser, 201);
});

export default auth;
```

**Step 4: Update `backend/src/index.ts` to wire health + auth routes**

```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { corsMiddleware } from './middleware/cors';
import { config } from './config';
import health from './routes/health';
import auth from './routes/auth';

const app = new Hono();
app.use('*', logger());
app.use('*', corsMiddleware);
app.route('/', health);
app.route('/', auth);

console.log(`Budget API running on port ${config.port}`);

export default {
  port: config.port,
  fetch: app.fetch,
};
```

**Step 5: Test manually**

Run: `cd backend && bun run src/index.ts`
Test: `curl -H "X-API-Key: dev-api-key" localhost:8000/api/v1/health`
Expected: `{"status":"healthy","timestamp":"..."}`

**Step 6: Commit**

```bash
git add backend/src/
git commit -m "feat: add health, auth routes with Zod schemas and JWT"
```

---

### Task 6: Implement CRUD routes (categories, periods, income-types)

**Files:**
- Create: `backend/src/routes/categories.ts`
- Create: `backend/src/routes/periods.ts`
- Create: `backend/src/routes/income-types.ts`

These three are structurally identical (simple name+color entities). Each needs: GET all, GET by id, POST, PUT, DELETE.

**Step 1: Create `backend/src/routes/categories.ts`**

```typescript
import { Hono } from 'hono';
import { db } from '../db/connection';
import { categories, expenses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import { categoryCreateSchema, categoryUpdateSchema } from '../types/schemas';

const router = new Hono();
router.use('/api/v1/categories/*', apiKeyAuth, optionalAuth);
router.use('/api/v1/categories', apiKeyAuth, optionalAuth);

router.get('/api/v1/categories', (c) => {
  const all = db.select().from(categories).all();
  return c.json(all);
});

router.get('/api/v1/categories/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const cat = db.select().from(categories).where(eq(categories.id, id)).get();
  if (!cat) return c.json({ detail: 'Category not found' }, 404);
  return c.json(cat);
});

router.post('/api/v1/categories', async (c) => {
  const body = categoryCreateSchema.parse(await c.req.json());
  const existing = db.select().from(categories).where(eq(categories.name, body.name)).get();
  if (existing) return c.json({ detail: 'Category already exists' }, 409);
  const now = new Date().toISOString();
  const userName = c.get('userName') as string | undefined;
  const result = db.insert(categories).values({
    name: body.name, color: body.color || '#8b5cf6',
    created_at: now, updated_at: now, created_by: userName, updated_by: userName,
  }).returning().get();
  return c.json(result, 201);
});

router.put('/api/v1/categories/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = categoryUpdateSchema.parse(await c.req.json());
  const existing = db.select().from(categories).where(eq(categories.id, id)).get();
  if (!existing) return c.json({ detail: 'Category not found' }, 404);
  const userName = c.get('userName') as string | undefined;
  const result = db.update(categories).set({
    ...body, updated_at: new Date().toISOString(), updated_by: userName,
  }).where(eq(categories.id, id)).returning().get();
  return c.json(result);
});

router.delete('/api/v1/categories/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const cat = db.select().from(categories).where(eq(categories.id, id)).get();
  if (!cat) return c.json({ detail: 'Category not found' }, 404);
  // Check for dependent expenses
  const deps = db.select().from(expenses).where(eq(expenses.category, cat.name)).all();
  if (deps.length > 0) return c.json({ detail: 'Cannot delete category with existing expenses' }, 409);
  db.delete(categories).where(eq(categories.id, id)).run();
  return c.json({ message: 'Category deleted' });
});

// Category summary (expenses grouped by category)
router.get('/api/v1/categories/summary', async (c) => {
  const monthId = c.req.query('month_id') ? parseInt(c.req.query('month_id')!) : null;
  let query = db.select().from(expenses);
  const allExpenses = monthId
    ? db.select().from(expenses).where(eq(expenses.month_id, monthId)).all()
    : db.select().from(expenses).all();

  const categoryMap = new Map<string, { budget: number; total: number }>();
  for (const exp of allExpenses) {
    const existing = categoryMap.get(exp.category) || { budget: 0, total: 0 };
    existing.budget += exp.budget;
    existing.total += exp.cost;
    categoryMap.set(exp.category, existing);
  }

  const allCats = db.select().from(categories).all();
  const catColorMap = new Map(allCats.map(cat => [cat.name, cat.color]));

  const result = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    color: catColorMap.get(category) || '#8b5cf6',
    budget: data.budget,
    total: data.total,
    over_budget: data.total > data.budget,
  }));

  return c.json(result);
});

export default router;
```

**Step 2: Create `backend/src/routes/periods.ts`**

Same structure as categories but for periods. Replace `categories` table with `periods`, dependency check against `expenses.period`.

```typescript
import { Hono } from 'hono';
import { db } from '../db/connection';
import { periods, expenses, incomes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import { periodCreateSchema, periodUpdateSchema } from '../types/schemas';

const router = new Hono();
router.use('/api/v1/periods/*', apiKeyAuth, optionalAuth);
router.use('/api/v1/periods', apiKeyAuth, optionalAuth);

router.get('/api/v1/periods', (c) => c.json(db.select().from(periods).all()));

router.get('/api/v1/periods/:id', (c) => {
  const p = db.select().from(periods).where(eq(periods.id, parseInt(c.req.param('id')))).get();
  return p ? c.json(p) : c.json({ detail: 'Period not found' }, 404);
});

router.post('/api/v1/periods', async (c) => {
  const body = periodCreateSchema.parse(await c.req.json());
  if (db.select().from(periods).where(eq(periods.name, body.name)).get()) {
    return c.json({ detail: 'Period already exists' }, 409);
  }
  const now = new Date().toISOString();
  const userName = c.get('userName') as string | undefined;
  return c.json(db.insert(periods).values({
    name: body.name, color: body.color || '#8b5cf6',
    created_at: now, updated_at: now, created_by: userName, updated_by: userName,
  }).returning().get(), 201);
});

router.put('/api/v1/periods/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = periodUpdateSchema.parse(await c.req.json());
  if (!db.select().from(periods).where(eq(periods.id, id)).get()) {
    return c.json({ detail: 'Period not found' }, 404);
  }
  const userName = c.get('userName') as string | undefined;
  return c.json(db.update(periods).set({
    ...body, updated_at: new Date().toISOString(), updated_by: userName,
  }).where(eq(periods.id, id)).returning().get());
});

router.delete('/api/v1/periods/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const p = db.select().from(periods).where(eq(periods.id, id)).get();
  if (!p) return c.json({ detail: 'Period not found' }, 404);
  const deps = db.select().from(expenses).where(eq(expenses.period, p.name)).all();
  if (deps.length > 0) return c.json({ detail: 'Cannot delete period with existing expenses' }, 409);
  db.delete(periods).where(eq(periods.id, id)).run();
  return c.json({ message: 'Period deleted' });
});

export default router;
```

**Step 3: Create `backend/src/routes/income-types.ts`**

Same pattern, for income types. Dependency check against `incomes.income_type_id`.

```typescript
import { Hono } from 'hono';
import { db } from '../db/connection';
import { incomeTypes, incomes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import { incomeTypeCreateSchema, incomeTypeUpdateSchema } from '../types/schemas';

const router = new Hono();
router.use('/api/v1/income-types/*', apiKeyAuth, optionalAuth);
router.use('/api/v1/income-types', apiKeyAuth, optionalAuth);

router.get('/api/v1/income-types', (c) => c.json(db.select().from(incomeTypes).all()));

router.get('/api/v1/income-types/:id', (c) => {
  const it = db.select().from(incomeTypes).where(eq(incomeTypes.id, parseInt(c.req.param('id')))).get();
  return it ? c.json(it) : c.json({ detail: 'Income type not found' }, 404);
});

router.post('/api/v1/income-types', async (c) => {
  const body = incomeTypeCreateSchema.parse(await c.req.json());
  if (db.select().from(incomeTypes).where(eq(incomeTypes.name, body.name)).get()) {
    return c.json({ detail: 'Income type already exists' }, 409);
  }
  const now = new Date().toISOString();
  const userName = c.get('userName') as string | undefined;
  return c.json(db.insert(incomeTypes).values({
    name: body.name, color: body.color || '#10b981',
    created_at: now, updated_at: now, created_by: userName, updated_by: userName,
  }).returning().get(), 201);
});

router.put('/api/v1/income-types/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = incomeTypeUpdateSchema.parse(await c.req.json());
  if (!db.select().from(incomeTypes).where(eq(incomeTypes.id, id)).get()) {
    return c.json({ detail: 'Income type not found' }, 404);
  }
  const userName = c.get('userName') as string | undefined;
  return c.json(db.update(incomeTypes).set({
    ...body, updated_at: new Date().toISOString(), updated_by: userName,
  }).where(eq(incomeTypes.id, id)).returning().get());
});

router.delete('/api/v1/income-types/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const it = db.select().from(incomeTypes).where(eq(incomeTypes.id, id)).get();
  if (!it) return c.json({ detail: 'Income type not found' }, 404);
  const deps = db.select().from(incomes).where(eq(incomes.income_type_id, id)).all();
  if (deps.length > 0) return c.json({ detail: 'Cannot delete income type with existing incomes' }, 409);
  db.delete(incomeTypes).where(eq(incomeTypes.id, id)).run();
  return c.json({ message: 'Income type deleted' });
});

export default router;
```

**Step 4: Wire routes in `src/index.ts`**

Add:
```typescript
import categoriesRouter from './routes/categories';
import periodsRouter from './routes/periods';
import incomeTypesRouter from './routes/income-types';

app.route('/', categoriesRouter);
app.route('/', periodsRouter);
app.route('/', incomeTypesRouter);
```

**Step 5: Commit**

```bash
git add backend/src/routes/
git commit -m "feat: add CRUD routes for categories, periods, and income types"
```

---

### Task 7: Implement expense and income routes

**Files:**
- Create: `backend/src/routes/expenses.ts`
- Create: `backend/src/routes/incomes.ts`

These are the main CRUD routes with filtering, reordering, purchases handling, and cloning.

**Step 1: Create `backend/src/routes/expenses.ts`**

Port from `backend-python-archive/controllers/expense_controller.py`. Include: GET all (with filters), GET by id, POST, PUT/PATCH, DELETE, reorder, pay (add purchase).

**Step 2: Create `backend/src/routes/incomes.ts`**

Port from `backend-python-archive/controllers/income_controller.py`. Include: GET all (with filters), GET by id, POST, PUT/PATCH, DELETE.

**Step 3: Wire in `src/index.ts`**

**Step 4: Test with existing database**

**Step 5: Commit**

```bash
git commit -m "feat: add expense and income CRUD routes with filtering and purchases"
```

---

### Task 8: Implement months route with clone functionality

**Files:**
- Create: `backend/src/routes/months.ts`

Port from `backend-python-archive/controllers/month_controller.py`. Include: GET all, GET by id, POST (auto-generates name/dates), PUT, DELETE, close/open, clone expenses+incomes to next month.

**Step 1: Create `backend/src/routes/months.ts`**

**Step 2: Wire in `src/index.ts`**

**Step 3: Commit**

```bash
git commit -m "feat: add month routes with close/open and clone functionality"
```

---

### Task 9: Implement summary routes

**Files:**
- Create: `backend/src/routes/summary.ts`

Port from `backend-python-archive/controllers/summary_controller.py` and `backend-python-archive/services/summary_service.py`.

Four endpoints:
1. `GET /api/v1/summary/totals` — aggregate totals
2. `GET /api/v1/summary/by-period` — period breakdown
3. `GET /api/v1/summary/expenses-by-period` — expense budget vs actual by period
4. `GET /api/v1/summary/monthly-trends` — historical trends

**Step 1: Create `backend/src/routes/summary.ts`**

Translate the Python SummaryService calculations to TypeScript. The logic queries expenses and incomes, groups by period/category, and computes aggregates.

**Step 2: Wire in `src/index.ts`**

**Step 3: Test against existing data**

Compare responses from old Python server vs new Hono server for the same endpoints.

**Step 4: Commit**

```bash
git commit -m "feat: add summary routes with totals, period, and trend calculations"
```

---

### Task 10: Implement backup, import, and static file serving

**Files:**
- Create: `backend/src/routes/backup.ts`
- Create: `backend/src/routes/import.ts`
- Create: `backend/src/routes/frontend.ts`

**Step 1: Create backup route** — Export data as JSON/Excel

**Step 2: Create import route** — Import from Excel (port existing pandas logic to a JS Excel library like `xlsx`)

**Step 3: Create frontend static file serving** — Serve `public/` with HTML injection for SPA

**Step 4: Wire all routes in `src/index.ts`**

**Step 5: Full smoke test** — Start server, test all endpoints

**Step 6: Commit**

```bash
git commit -m "feat: add backup, import, and frontend static file serving"
```

---

### Task 11: Update Makefile and Docker configuration

**Files:**
- Modify: `Makefile`
- Modify: `Dockerfile`
- Modify: `docker-compose.yml`

**Step 1: Update Makefile targets**

Replace Python commands with Bun equivalents:
- `make backend` → `cd backend && bun run src/index.ts`
- `make install` → `cd backend && bun install`
- `make test-backend` → `cd backend && bun test`
- Remove alembic/migration targets (Drizzle uses different commands)
- Add `make db-push` → `cd backend && bun drizzle-kit push`

**Step 2: Update Dockerfile**

Replace Python multi-stage build with Bun-based build:
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY backend/package.json backend/bun.lockb ./backend/
RUN cd backend && bun install --production
COPY backend/src ./backend/src
# ... frontend build stage stays the same but uses bun
```

**Step 3: Update docker-compose.yml**

**Step 4: Commit**

```bash
git commit -m "chore: update Makefile, Dockerfile, and docker-compose for Bun backend"
```

---

### Task 12: Validate full API parity

**Step 1: Write a comparison test script**

Create `backend/scripts/validate-parity.ts` that calls every endpoint on both the old Python server (if still running) and new Bun server, comparing responses.

**Step 2: Run validation**

**Step 3: Fix any discrepancies**

**Step 4: Remove Python archive**

```bash
rm -rf backend-python-archive
```

**Step 5: Commit**

```bash
git commit -m "chore: validate API parity and remove Python backend archive"
```

---

## Phase 3: Terminology Change ("budget" → "projected")

### Task 13: Rename database column and API fields

**Files:**
- Modify: `backend/src/db/schema.ts`
- Modify: `backend/src/types/schemas.ts`
- Modify: `backend/src/routes/summary.ts`
- Modify: `backend/src/routes/expenses.ts`
- Modify: `backend/src/routes/incomes.ts`
- Modify: `backend/src/routes/categories.ts`

**Step 1: Create a Drizzle migration to rename the column**

The `expenses.budget` column becomes `expenses.projected`, and `incomes.budget` becomes `incomes.projected`. Create a SQL migration:

```sql
ALTER TABLE expenses RENAME COLUMN budget TO projected;
ALTER TABLE incomes RENAME COLUMN budget TO projected;
```

**Step 2: Update Drizzle schema**

In `schema.ts`, change `budget: real('budget')` to `projected: real('projected')` for both tables.

**Step 3: Update all route handlers and Zod schemas**

- `expenseCreateSchema`: `budget` → `projected`
- `incomeCreateSchema`: `budget` → `projected`
- Summary responses: `total_budgeted_*` → `total_projected_*`, `budget` → `projected`, `over_budget` → `over_projected`

**Step 4: Commit**

```bash
git commit -m "feat: rename 'budget' to 'projected' in database and API responses"
```

---

### Task 14: Update web frontend terminology

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/hooks/useSummary.ts`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/components/Summary.tsx`
- Modify: `frontend/src/components/SummaryCards.tsx`
- Search and replace across all frontend files

**Step 1: Update TypeScript types**

In `frontend/src/types/index.ts`:
- `CategorySummary.budget` → `CategorySummary.projected`
- `ExpensePeriodSummary.budget` → `ExpensePeriodSummary.projected`
- `ExpensePeriodSummary.over_budget` → `ExpensePeriodSummary.over_projected`
- `IncomeTypeSummary.budget` → `IncomeTypeSummary.projected`
- `SummaryTotals.total_budgeted_*` → `SummaryTotals.total_projected_*`

**Step 2: Update UI labels**

In `Summary.tsx`:
- Column header "Budget" → "Projected"
- Badge "On Budget" → "On Track"
- Badge "Over Budget" → "Over Projected"
- "Budget Control" → "Projection Control"
- "Total (with over)" → "Total (with over-projected)"

In `SummaryCards.tsx`:
- "of $X budgeted" → "of $X projected"

**Step 3: Search for any remaining "budget"/"budgeted" references in UI labels**

Run: `grep -r "budget\|Budget\|budgeted\|Budgeted" frontend/src/ --include="*.tsx" --include="*.ts"`

Fix any remaining references.

**Step 4: Commit**

```bash
git commit -m "feat: rename 'budget' to 'projected' across web frontend"
```

---

### Task 15: Update mobile app terminology

**Files:**
- Modify: `mobile/src/types/index.ts` (or wherever types are defined)
- Modify: `mobile/src/hooks/useSummary.ts`
- Modify: `mobile/src/screens/MonthlyBudgetScreen/Summary.tsx`
- Modify: `mobile/src/screens/MonthlyBudgetScreen/SummaryCards.tsx`
- Search all mobile files

**Step 1: Same type changes as web**

**Step 2: Update UI labels — same mapping as web**

**Step 3: Search for remaining references**

Run: `grep -r "budget\|Budget\|budgeted\|Budgeted" mobile/src/ --include="*.tsx" --include="*.ts"`

**Step 4: Commit**

```bash
git commit -m "feat: rename 'budget' to 'projected' across mobile app"
```

---

### Task 16: Update TUI terminology

**Files:**
- Modify: `tui/src/models/summary.rs`
- Modify: `tui/src/ui/tabs/summary.rs`
- Search all TUI files

**Step 1: Update Rust model field names**

In `models/summary.rs`: `budget` → `projected`, `over_budget` → `over_projected`, `total_budgeted_*` → `total_projected_*`

**Step 2: Update UI rendering labels**

In `ui/tabs/summary.rs`: All "Budget"/"Budgeted" labels → "Projected"

**Step 3: Search for remaining**

Run: `grep -r "budget\|Budget\|budgeted\|Budgeted" tui/src/ --include="*.rs"`

**Step 4: Commit**

```bash
git commit -m "feat: rename 'budget' to 'projected' across TUI"
```

---

## Phase 4: Summary UI Improvements

### Task 17: Add insights endpoint to backend

**Files:**
- Modify: `backend/src/routes/summary.ts`
- Modify: `backend/src/types/schemas.ts`

**Step 1: Add Zod schema for insights response**

In `types/schemas.ts`:
```typescript
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
  over_projected_count: z.number(),
  total_categories: z.number(),
});
```

**Step 2: Implement insights endpoint**

In `routes/summary.ts`, add `GET /api/v1/summary/insights`:

Logic:
1. Get current month expenses and incomes
2. Get previous month data (if available)
3. Compare spending by category (% change month-over-month)
4. Count over-projected categories
5. Calculate projected savings based on spending rate
6. Determine budget_health: good (<80% projected spent), warning (80-100%), critical (>100%)
7. Generate insight messages

**Step 3: Test endpoint**

**Step 4: Commit**

```bash
git commit -m "feat: add summary insights endpoint with smart analysis"
```

---

### Task 18: Add charts to web frontend summary

**Files:**
- Create: `frontend/src/components/summary/InsightsBar.tsx`
- Create: `frontend/src/components/summary/ExpenseDonutChart.tsx`
- Create: `frontend/src/components/summary/BudgetComparisonChart.tsx`
- Create: `frontend/src/components/summary/TrendSparkline.tsx`
- Modify: `frontend/src/hooks/useSummary.ts` (add `useInsights` and `useMonthlyTrends` hooks)
- Modify: `frontend/src/api/client.ts` (add insights API method)
- Modify: `frontend/src/components/Summary.tsx` (new layout)

Note: `recharts` is already in `frontend/package.json` — no new dependency needed.

**Step 1: Add insights API method and hook**

In `client.ts` add `getInsights()` method.
In `useSummary.ts` add `useInsights()` and `useMonthlyTrends()` hooks.

**Step 2: Create `InsightsBar` component**

Horizontal scrollable row of insight cards. Each card shows an icon, colored by type (green/yellow/red), with the message text.

**Step 3: Create `ExpenseDonutChart` component**

Recharts `PieChart` with `Pie` using category summary data. Shows expense distribution by category with colors from category data.

**Step 4: Create `BudgetComparisonChart` component**

Recharts `BarChart` with horizontal bars showing projected vs actual per period.

**Step 5: Create `TrendSparkline` component**

Recharts `AreaChart` showing 6-month income and expense lines.

**Step 6: Update `Summary.tsx` layout**

New structure:
1. Insights bar (new)
2. 2-column grid: donut chart + bar chart (new)
3. Trend sparkline (new)
4. Collapsible table sections (existing, wrapped in collapsible containers)

**Step 7: Add collapsible section wrapper**

Create a simple `CollapsibleSection` component using useState for toggle.

**Step 8: Test in browser**

**Step 9: Commit**

```bash
git commit -m "feat: add charts, insights bar, and improved layout to web summary"
```

---

### Task 19: Add charts to mobile summary

**Files:**
- Modify: `mobile/package.json` (add charting library if needed)
- Create: `mobile/src/components/summary/InsightsBar.tsx`
- Create: `mobile/src/components/summary/ExpenseDonutChart.tsx`
- Create: `mobile/src/components/summary/TrendSparkline.tsx`
- Modify: `mobile/src/hooks/useSummary.ts` (add hooks)
- Modify: `mobile/src/screens/MonthlyBudgetScreen/Summary.tsx` (new layout)

**Step 1: Install charting library**

```bash
cd mobile && npx expo install victory-native react-native-svg
```

Or use `react-native-chart-kit` if Victory is too heavy.

**Step 2: Create mobile insight and chart components**

Adapt web components to React Native (View, Text, ScrollView instead of divs).

**Step 3: Update mobile Summary screen layout**

Single-column stacked: insights → charts → collapsible tables.

**Step 4: Test on simulator**

**Step 5: Commit**

```bash
git commit -m "feat: add charts and insights to mobile summary screen"
```

---

### Task 20: Add insights to TUI summary

**Files:**
- Modify: `tui/src/models/summary.rs` (add insights types)
- Modify: `tui/src/api/summary.rs` (add insights API call)
- Modify: `tui/src/ui/tabs/summary.rs` (render insights + enhanced charts)

**Step 1: Add Rust types for insights**

```rust
pub struct SummaryInsight {
    pub insight_type: String,  // "warning" | "positive" | "neutral"
    pub icon: String,
    pub message: String,
    pub category: Option<String>,
}

pub struct SummaryInsights {
    pub insights: Vec<SummaryInsight>,
    pub savings_projection: f64,
    pub budget_health: String,
    pub over_projected_count: u32,
    pub total_categories: u32,
}
```

**Step 2: Add API call for insights**

**Step 3: Render insights as colored text list in TUI**

Use Ratatui Paragraph widget with styled spans (green for positive, yellow for warning, red for critical).

**Step 4: Enhance existing bar chart rendering**

Ratatui already has BarChart widget — use it for period comparison.

**Step 5: Commit**

```bash
git commit -m "feat: add insights and enhanced charts to TUI summary"
```

---

## Phase 5: Finalization

### Task 21: Update environment configuration and documentation

**Files:**
- Modify: `backend/.env.example` (or create if needed)
- Modify: root `README.md` if it references Python setup

**Step 1: Create/update `.env.example`**

```env
ENV=development
PORT=8000
API_KEY=your-secret-api-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_PATH=./data/budget.db

# Optional: SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@budget.local
SMTP_USE_TLS=true

# Optional: Password Reset
RESET_CODE_LENGTH=6
RESET_CODE_EXPIRATION_MINUTES=30
RESET_TOKEN_EXPIRATION_HOURS=24
```

**Step 2: Commit**

```bash
git commit -m "chore: update environment config and docs for Bun backend"
```

---

### Task 22: End-to-end testing and cleanup

**Step 1: Start the full stack** — Backend + frontend + mobile

**Step 2: Test all critical flows:**
- Login/register
- Create month
- Add expenses and incomes
- View summary with new charts and insights
- Clone month
- Backup/import
- Password reset

**Step 3: Fix any issues found**

**Step 4: Clean up any TODO comments or temporary code**

**Step 5: Final commit**

```bash
git commit -m "chore: end-to-end testing complete, cleanup"
```

---

## Summary of Execution Order

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Backend project setup, schema, config, middleware |
| 2 | 5-12 | All route implementations and validation |
| 3 | 13-16 | "budget" → "projected" rename across all platforms |
| 4 | 17-20 | Summary UI improvements (insights, charts) on all platforms |
| 5 | 21-22 | Documentation, testing, cleanup |

**Total tasks: 22**
**Estimated commits: ~22**
