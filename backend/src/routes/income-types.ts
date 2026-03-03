/**
 * Income Type CRUD routes.
 * Ported from backend-python-archive/controllers/income_type_controller.py
 * and backend-python-archive/services/income_type_service.py.
 */

import { Hono } from 'hono';
import { eq, ne, and, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';

import { db } from '../db/connection';
import { incomeTypes, incomes } from '../db/schema';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import { incomeTypeCreateSchema, incomeTypeUpdateSchema } from '../types/schemas';

type Variables = {
  userId: number;
  userName: string;
};

const incomeTypesRoute = new Hono<{ Variables: Variables }>();

function now(): string {
  return new Date().toISOString();
}

// ─── GET /api/v1/income-types ───────────────────────────────────────────────

incomeTypesRoute.get('/api/v1/income-types', apiKeyAuth, optionalAuth, async (c) => {
  const allIncomeTypes = await db.select().from(incomeTypes);
  return c.json(allIncomeTypes);
});

// ─── GET /api/v1/income-types/summary ────────────────────────────────────────

incomeTypesRoute.get('/api/v1/income-types/summary', apiKeyAuth, optionalAuth, async (c) => {
  const periodParam = c.req.query('period');
  const monthIdParam = c.req.query('month_id');
  const monthId = monthIdParam ? parseInt(monthIdParam, 10) : null;

  // Build conditions
  const conditions = [];
  if (monthId !== null) conditions.push(eq(incomes.month_id, monthId));
  if (periodParam) conditions.push(eq(incomes.period, periodParam));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = whereClause
    ? await db
        .select({
          income_type: incomeTypes.name,
          budget: sql<number>`coalesce(sum(${incomes.budget}), 0)`,
          total: sql<number>`coalesce(sum(${incomes.amount}), 0)`,
        })
        .from(incomes)
        .innerJoin(incomeTypes, eq(incomes.income_type_id, incomeTypes.id))
        .where(whereClause)
        .groupBy(incomeTypes.name)
        .orderBy(incomeTypes.name)
    : await db
        .select({
          income_type: incomeTypes.name,
          budget: sql<number>`coalesce(sum(${incomes.budget}), 0)`,
          total: sql<number>`coalesce(sum(${incomes.amount}), 0)`,
        })
        .from(incomes)
        .innerJoin(incomeTypes, eq(incomes.income_type_id, incomeTypes.id))
        .groupBy(incomeTypes.name)
        .orderBy(incomeTypes.name);

  return c.json(rows);
});

// ─── GET /api/v1/income-types/:id ───────────────────────────────────────────

incomeTypesRoute.get('/api/v1/income-types/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [incomeType] = await db
    .select()
    .from(incomeTypes)
    .where(eq(incomeTypes.id, id))
    .limit(1);

  if (!incomeType) {
    return c.json({ detail: 'Income type not found' }, 404);
  }

  return c.json(incomeType);
});

// ─── POST /api/v1/income-types ──────────────────────────────────────────────

incomeTypesRoute.post(
  '/api/v1/income-types',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', incomeTypeCreateSchema),
  async (c) => {
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    // Check if income type already exists
    const [existing] = await db
      .select()
      .from(incomeTypes)
      .where(eq(incomeTypes.name, body.name))
      .limit(1);

    if (existing) {
      return c.json({ detail: 'Income type already exists' }, 400);
    }

    const timestamp = now();
    const [created] = await db
      .insert(incomeTypes)
      .values({
        name: body.name,
        color: body.color ?? '#10b981',
        created_at: timestamp,
        updated_at: timestamp,
        created_by: userName ?? null,
        updated_by: userName ?? null,
      })
      .returning();

    return c.json(created, 201);
  },
);

// ─── PUT /api/v1/income-types/:id ───────────────────────────────────────────

incomeTypesRoute.put(
  '/api/v1/income-types/:id',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', incomeTypeUpdateSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    const [incomeType] = await db
      .select()
      .from(incomeTypes)
      .where(eq(incomeTypes.id, id))
      .limit(1);

    if (!incomeType) {
      return c.json({ detail: 'Income type not found' }, 404);
    }

    // Check if new name already exists (excluding current income type)
    const [conflict] = await db
      .select()
      .from(incomeTypes)
      .where(and(eq(incomeTypes.name, body.name), ne(incomeTypes.id, id)))
      .limit(1);

    if (conflict) {
      return c.json({ detail: 'Income type name already exists' }, 400);
    }

    const [updated] = await db
      .update(incomeTypes)
      .set({
        name: body.name,
        color: body.color ?? incomeType.color,
        updated_at: now(),
        updated_by: userName ?? null,
      })
      .where(eq(incomeTypes.id, id))
      .returning();

    return c.json(updated);
  },
);

// ─── DELETE /api/v1/income-types/:id ────────────────────────────────────────

incomeTypesRoute.delete(
  '/api/v1/income-types/:id',
  apiKeyAuth,
  optionalAuth,
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);

    const [incomeType] = await db
      .select()
      .from(incomeTypes)
      .where(eq(incomeTypes.id, id))
      .limit(1);

    if (!incomeType) {
      return c.json({ detail: 'Income type not found' }, 404);
    }

    // Check for dependent incomes by income_type_id
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incomes)
      .where(eq(incomes.income_type_id, id));

    if (countResult.count > 0) {
      return c.json(
        { detail: `Cannot delete income type: it is used by ${countResult.count} income(s)` },
        409,
      );
    }

    await db.delete(incomeTypes).where(eq(incomeTypes.id, id));

    return c.json({ message: 'Income type deleted successfully' });
  },
);

export default incomeTypesRoute;
