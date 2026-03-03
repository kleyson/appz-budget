/**
 * Category CRUD routes.
 * Ported from backend-python-archive/controllers/category_controller.py
 * and backend-python-archive/services/category_service.py.
 */

import { Hono } from 'hono';
import { eq, ne, and, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';

import { db } from '../db/connection';
import { categories, expenses } from '../db/schema';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import { categoryCreateSchema, categoryUpdateSchema } from '../types/schemas';

type Variables = {
  userId: number;
  userName: string;
};

const categoriesRoute = new Hono<{ Variables: Variables }>();

function now(): string {
  return new Date().toISOString();
}

// ─── GET /api/v1/categories ─────────────────────────────────────────────────

categoriesRoute.get('/api/v1/categories', apiKeyAuth, optionalAuth, async (c) => {
  const allCategories = await db.select().from(categories);
  return c.json(allCategories);
});

// ─── GET /api/v1/categories/summary ─────────────────────────────────────────

categoriesRoute.get('/api/v1/categories/summary', apiKeyAuth, optionalAuth, async (c) => {
  const monthIdParam = c.req.query('month_id');
  const periodParam = c.req.query('period');
  const monthId = monthIdParam ? parseInt(monthIdParam, 10) : null;

  // Build conditions for the query
  const conditions = [];
  if (monthId !== null) conditions.push(eq(expenses.month_id, monthId));
  if (periodParam) conditions.push(eq(expenses.period, periodParam));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = whereClause
    ? await db
        .select({
          category: expenses.category,
          budget: sql<number>`coalesce(sum(${expenses.budget}), 0)`,
          total: sql<number>`coalesce(sum(${expenses.cost}), 0)`,
        })
        .from(expenses)
        .where(whereClause)
        .groupBy(expenses.category)
        .orderBy(expenses.category)
    : await db
        .select({
          category: expenses.category,
          budget: sql<number>`coalesce(sum(${expenses.budget}), 0)`,
          total: sql<number>`coalesce(sum(${expenses.cost}), 0)`,
        })
        .from(expenses)
        .groupBy(expenses.category)
        .orderBy(expenses.category);

  const summaries = rows.map((row) => ({
    category: row.category,
    budget: row.budget,
    total: row.total,
    over_budget: row.total > row.budget,
  }));

  return c.json(summaries);
});

// ─── GET /api/v1/categories/:id ─────────────────────────────────────────────

categoriesRoute.get('/api/v1/categories/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!category) {
    return c.json({ detail: 'Category not found' }, 404);
  }

  return c.json(category);
});

// ─── POST /api/v1/categories ────────────────────────────────────────────────

categoriesRoute.post(
  '/api/v1/categories',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', categoryCreateSchema),
  async (c) => {
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    // Check if category already exists
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, body.name))
      .limit(1);

    if (existing) {
      return c.json({ detail: 'Category already exists' }, 400);
    }

    const timestamp = now();
    const [created] = await db
      .insert(categories)
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

// ─── PUT /api/v1/categories/:id ─────────────────────────────────────────────

categoriesRoute.put(
  '/api/v1/categories/:id',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', categoryUpdateSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      return c.json({ detail: 'Category not found' }, 404);
    }

    // Check if new name already exists (excluding current category)
    const [conflict] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.name, body.name), ne(categories.id, id)))
      .limit(1);

    if (conflict) {
      return c.json({ detail: 'Category name already exists' }, 400);
    }

    // Update expenses that use the old category name
    const oldName = category.name;
    if (oldName !== body.name) {
      await db
        .update(expenses)
        .set({ category: body.name })
        .where(eq(expenses.category, oldName));
    }

    const [updated] = await db
      .update(categories)
      .set({
        name: body.name,
        color: body.color ?? category.color,
        updated_at: now(),
        updated_by: userName ?? null,
      })
      .where(eq(categories.id, id))
      .returning();

    return c.json(updated);
  },
);

// ─── DELETE /api/v1/categories/:id ──────────────────────────────────────────

categoriesRoute.delete(
  '/api/v1/categories/:id',
  apiKeyAuth,
  optionalAuth,
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      return c.json({ detail: 'Category not found' }, 404);
    }

    // Check for dependent expenses
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(eq(expenses.category, category.name));

    const expenseCount = countResult.count;
    if (expenseCount > 0) {
      return c.json(
        { detail: `Cannot delete category: it is used by ${expenseCount} expense(s)` },
        409,
      );
    }

    await db.delete(categories).where(eq(categories.id, id));

    return c.json({ message: 'Category deleted successfully' });
  },
);

export default categoriesRoute;
