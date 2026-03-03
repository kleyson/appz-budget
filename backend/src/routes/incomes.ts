/**
 * Income CRUD routes.
 * Ported from backend-python-archive/controllers/income_controller.py
 * and backend-python-archive/services/income_service.py.
 */

import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';

import { db } from '../db/connection';
import { incomes, months, incomeTypes } from '../db/schema';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import { incomeCreateSchema, incomeUpdateSchema } from '../types/schemas';

type Variables = {
  userId: number;
  userName: string;
};

const incomesRoute = new Hono<{ Variables: Variables }>();

function now(): string {
  return new Date().toISOString();
}

// ─── GET /api/v1/incomes ────────────────────────────────────────────────────

incomesRoute.get('/api/v1/incomes', apiKeyAuth, optionalAuth, async (c) => {
  const monthIdParam = c.req.query('month_id');
  const period = c.req.query('period');
  const incomeTypeIdParam = c.req.query('income_type_id');

  const conditions = [];
  if (monthIdParam) {
    conditions.push(eq(incomes.month_id, parseInt(monthIdParam, 10)));
  }
  if (period) {
    conditions.push(eq(incomes.period, period));
  }
  if (incomeTypeIdParam) {
    conditions.push(eq(incomes.income_type_id, parseInt(incomeTypeIdParam, 10)));
  }

  const query = db
    .select()
    .from(incomes)
    .orderBy(incomes.income_type_id);

  const rows =
    conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

  return c.json(rows);
});

// ─── GET /api/v1/incomes/:id ────────────────────────────────────────────────

incomesRoute.get('/api/v1/incomes/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [income] = await db
    .select()
    .from(incomes)
    .where(eq(incomes.id, id))
    .limit(1);

  if (!income) {
    return c.json({ detail: 'Income not found' }, 404);
  }

  return c.json(income);
});

// ─── POST /api/v1/incomes ───────────────────────────────────────────────────

incomesRoute.post(
  '/api/v1/incomes',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', incomeCreateSchema),
  async (c) => {
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    // Validate month exists and is not closed
    const [month] = await db
      .select()
      .from(months)
      .where(eq(months.id, body.month_id))
      .limit(1);

    if (!month) {
      return c.json({ detail: `Month with ID ${body.month_id} not found` }, 400);
    }
    if (month.is_closed) {
      return c.json({ detail: `Cannot add income: Month '${month.name}' is closed` }, 400);
    }

    // Validate income_type_id exists
    const [incomeType] = await db
      .select()
      .from(incomeTypes)
      .where(eq(incomeTypes.id, body.income_type_id))
      .limit(1);

    if (!incomeType) {
      return c.json({ detail: `Income type with ID ${body.income_type_id} not found` }, 400);
    }

    const timestamp = now();
    const [created] = await db
      .insert(incomes)
      .values({
        income_type_id: body.income_type_id,
        period: body.period,
        budget: body.budget ?? 0,
        amount: body.amount ?? 0,
        month_id: body.month_id,
        created_at: timestamp,
        updated_at: timestamp,
        created_by: userName ?? null,
        updated_by: userName ?? null,
      })
      .returning();

    return c.json(created, 201);
  },
);

// ─── PUT /api/v1/incomes/:id ────────────────────────────────────────────────

incomesRoute.put(
  '/api/v1/incomes/:id',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', incomeUpdateSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    const [income] = await db
      .select()
      .from(incomes)
      .where(eq(incomes.id, id))
      .limit(1);

    if (!income) {
      return c.json({ detail: 'Income not found' }, 404);
    }

    // Validate month is not closed (check target month_id or current)
    const monthIdToCheck = body.month_id ?? income.month_id;
    const [month] = await db
      .select()
      .from(months)
      .where(eq(months.id, monthIdToCheck))
      .limit(1);

    if (!month) {
      return c.json({ detail: `Month with ID ${monthIdToCheck} not found` }, 400);
    }
    if (month.is_closed) {
      return c.json({ detail: `Cannot update income: Month '${month.name}' is closed` }, 400);
    }

    // Validate income_type_id if provided
    if (body.income_type_id !== undefined) {
      const [incomeType] = await db
        .select()
        .from(incomeTypes)
        .where(eq(incomeTypes.id, body.income_type_id))
        .limit(1);

      if (!incomeType) {
        return c.json({ detail: `Income type with ID ${body.income_type_id} not found` }, 400);
      }
    }

    // Build update payload (only fields that were actually sent)
    const updateData: Record<string, unknown> = {
      updated_at: now(),
      updated_by: userName ?? null,
    };

    if (body.income_type_id !== undefined) updateData.income_type_id = body.income_type_id;
    if (body.period !== undefined) updateData.period = body.period;
    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.month_id !== undefined) updateData.month_id = body.month_id;

    const [updated] = await db
      .update(incomes)
      .set(updateData)
      .where(eq(incomes.id, id))
      .returning();

    return c.json(updated);
  },
);

// ─── DELETE /api/v1/incomes/:id ─────────────────────────────────────────────

incomesRoute.delete('/api/v1/incomes/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [income] = await db
    .select()
    .from(incomes)
    .where(eq(incomes.id, id))
    .limit(1);

  if (!income) {
    return c.json({ detail: 'Income not found' }, 404);
  }

  // Check if month is closed
  const [month] = await db
    .select()
    .from(months)
    .where(eq(months.id, income.month_id))
    .limit(1);

  if (month && month.is_closed) {
    return c.json({ detail: `Cannot delete income: Month '${month.name}' is closed` }, 400);
  }

  await db.delete(incomes).where(eq(incomes.id, id));

  return c.json({ message: 'Income deleted successfully' });
});

export default incomesRoute;
