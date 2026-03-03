/**
 * Period CRUD routes.
 * Ported from backend-python-archive/controllers/period_controller.py
 * and backend-python-archive/services/period_service.py.
 */

import { Hono } from 'hono';
import { eq, ne, and, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';

import { db } from '../db/connection';
import { periods, expenses, incomes } from '../db/schema';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import { periodCreateSchema, periodUpdateSchema } from '../types/schemas';

type Variables = {
  userId: number;
  userName: string;
};

const periodsRoute = new Hono<{ Variables: Variables }>();

function now(): string {
  return new Date().toISOString();
}

// ─── GET /api/v1/periods ────────────────────────────────────────────────────

periodsRoute.get('/api/v1/periods', apiKeyAuth, optionalAuth, async (c) => {
  const allPeriods = await db.select().from(periods);
  return c.json(allPeriods);
});

// ─── GET /api/v1/periods/:id ────────────────────────────────────────────────

periodsRoute.get('/api/v1/periods/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [period] = await db
    .select()
    .from(periods)
    .where(eq(periods.id, id))
    .limit(1);

  if (!period) {
    return c.json({ detail: 'Period not found' }, 404);
  }

  return c.json(period);
});

// ─── POST /api/v1/periods ───────────────────────────────────────────────────

periodsRoute.post(
  '/api/v1/periods',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', periodCreateSchema),
  async (c) => {
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    // Check if period already exists
    const [existing] = await db
      .select()
      .from(periods)
      .where(eq(periods.name, body.name))
      .limit(1);

    if (existing) {
      return c.json({ detail: 'Period already exists' }, 400);
    }

    const timestamp = now();
    const [created] = await db
      .insert(periods)
      .values({
        name: body.name,
        color: body.color ?? '#8b5cf6',
        created_at: timestamp,
        updated_at: timestamp,
        created_by: userName ?? null,
        updated_by: userName ?? null,
      })
      .returning();

    return c.json(created, 201);
  },
);

// ─── PUT /api/v1/periods/:id ────────────────────────────────────────────────

periodsRoute.put(
  '/api/v1/periods/:id',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', periodUpdateSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    const [period] = await db
      .select()
      .from(periods)
      .where(eq(periods.id, id))
      .limit(1);

    if (!period) {
      return c.json({ detail: 'Period not found' }, 404);
    }

    // Check if new name already exists (excluding current period)
    const [conflict] = await db
      .select()
      .from(periods)
      .where(and(eq(periods.name, body.name), ne(periods.id, id)))
      .limit(1);

    if (conflict) {
      return c.json({ detail: 'Period name already exists' }, 400);
    }

    // Update expenses and incomes that use the old period name
    const oldName = period.name;
    if (oldName !== body.name) {
      await db
        .update(expenses)
        .set({ period: body.name })
        .where(eq(expenses.period, oldName));

      await db
        .update(incomes)
        .set({ period: body.name })
        .where(eq(incomes.period, oldName));
    }

    const [updated] = await db
      .update(periods)
      .set({
        name: body.name,
        color: body.color ?? period.color,
        updated_at: now(),
        updated_by: userName ?? null,
      })
      .where(eq(periods.id, id))
      .returning();

    return c.json(updated);
  },
);

// ─── DELETE /api/v1/periods/:id ─────────────────────────────────────────────

periodsRoute.delete(
  '/api/v1/periods/:id',
  apiKeyAuth,
  optionalAuth,
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);

    const [period] = await db
      .select()
      .from(periods)
      .where(eq(periods.id, id))
      .limit(1);

    if (!period) {
      return c.json({ detail: 'Period not found' }, 404);
    }

    // Check for dependent expenses
    const [expenseCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(eq(expenses.period, period.name));

    if (expenseCount.count > 0) {
      return c.json(
        { detail: `Cannot delete period: it is used by ${expenseCount.count} expense(s)` },
        409,
      );
    }

    // Check for dependent incomes
    const [incomeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incomes)
      .where(eq(incomes.period, period.name));

    if (incomeCount.count > 0) {
      return c.json(
        { detail: `Cannot delete period: it is used by ${incomeCount.count} income(s)` },
        409,
      );
    }

    await db.delete(periods).where(eq(periods.id, id));

    return c.json({ message: 'Period deleted successfully' });
  },
);

export default periodsRoute;
