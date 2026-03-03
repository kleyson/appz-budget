/**
 * Expense CRUD routes.
 * Ported from backend-python-archive/controllers/expense_controller.py
 * and backend-python-archive/services/expense_service.py.
 */

import { Hono } from 'hono';
import { eq, and, asc, sql } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';

import { db } from '../db/connection';
import { expenses, months } from '../db/schema';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import {
  expenseCreateSchema,
  expenseUpdateSchema,
  expenseReorderSchema,
  payExpenseSchema,
} from '../types/schemas';

type Variables = {
  userId: number;
  userName: string;
};

const expensesRoute = new Hono<{ Variables: Variables }>();

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse the purchases JSON text field into an array.
 * Returns null if the field is empty/null/invalid.
 */
function parsePurchases(raw: string | null): Array<{ name: string; amount: number; date?: string }> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Serialize a row from the database, parsing the purchases JSON field.
 */
function serializeExpense(row: typeof expenses.$inferSelect) {
  return {
    ...row,
    purchases: parsePurchases(row.purchases),
  };
}

// ─── GET /api/v1/expenses ───────────────────────────────────────────────────

expensesRoute.get('/api/v1/expenses', apiKeyAuth, optionalAuth, async (c) => {
  const monthIdParam = c.req.query('month_id');
  const period = c.req.query('period');
  const category = c.req.query('category');

  const conditions = [];
  if (monthIdParam) {
    conditions.push(eq(expenses.month_id, parseInt(monthIdParam, 10)));
  }
  if (period) {
    conditions.push(eq(expenses.period, period));
  }
  if (category) {
    conditions.push(eq(expenses.category, category));
  }

  const query = db
    .select()
    .from(expenses)
    .orderBy(asc(expenses.order), asc(expenses.expense_name));

  const rows =
    conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

  return c.json(rows.map(serializeExpense));
});

// ─── GET /api/v1/expenses/:id ───────────────────────────────────────────────

expensesRoute.get('/api/v1/expenses/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);

  if (!expense) {
    return c.json({ detail: 'Expense not found' }, 404);
  }

  return c.json(serializeExpense(expense));
});

// ─── POST /api/v1/expenses ──────────────────────────────────────────────────

expensesRoute.post(
  '/api/v1/expenses',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', expenseCreateSchema),
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
      return c.json({ detail: `Cannot add expense: Month '${month.name}' is closed` }, 400);
    }

    // Set expense_date to today if not provided
    const expenseDate = body.expense_date || today();

    // Calculate cost from purchases if they exist
    let cost = body.cost ?? 0;
    let purchasesJson: string | null = null;

    if (body.purchases && body.purchases.length > 0) {
      cost = body.purchases.reduce((sum, p) => sum + (p.amount ?? 0), 0);
      purchasesJson = JSON.stringify(body.purchases);
    }

    // Set order if not provided — use max(order)+1 for this month
    let order = body.order;
    if (order === undefined || order === null || order === 0) {
      const [maxRow] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${expenses.order}), -1)` })
        .from(expenses)
        .where(eq(expenses.month_id, body.month_id));
      order = (maxRow?.maxOrder ?? -1) + 1;
    }

    const timestamp = now();
    const [created] = await db
      .insert(expenses)
      .values({
        expense_name: body.expense_name,
        period: body.period,
        category: body.category,
        budget: body.budget ?? 0,
        cost,
        notes: body.notes ?? null,
        month_id: body.month_id,
        order,
        purchases: purchasesJson,
        expense_date: expenseDate,
        created_at: timestamp,
        updated_at: timestamp,
        created_by: userName ?? null,
        updated_by: userName ?? null,
      })
      .returning();

    return c.json(serializeExpense(created), 201);
  },
);

// ─── PUT /api/v1/expenses/:id ───────────────────────────────────────────────

expensesRoute.put(
  '/api/v1/expenses/:id',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', expenseUpdateSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);

    if (!expense) {
      return c.json({ detail: 'Expense not found' }, 404);
    }

    // Validate month is not closed (check target month_id or current)
    const monthIdToCheck = body.month_id ?? expense.month_id;
    const [month] = await db
      .select()
      .from(months)
      .where(eq(months.id, monthIdToCheck))
      .limit(1);

    if (!month) {
      return c.json({ detail: `Month with ID ${monthIdToCheck} not found` }, 400);
    }
    if (month.is_closed) {
      return c.json({ detail: `Cannot update expense: Month '${month.name}' is closed` }, 400);
    }

    // Build the update payload (only fields that were actually sent)
    const updateData: Record<string, unknown> = {
      updated_at: now(),
      updated_by: userName ?? null,
    };

    if (body.expense_name !== undefined) updateData.expense_name = body.expense_name;
    if (body.period !== undefined) updateData.period = body.period;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.month_id !== undefined) updateData.month_id = body.month_id;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.expense_date !== undefined) updateData.expense_date = body.expense_date;

    // Handle purchases and cost recalculation
    if (body.purchases !== undefined) {
      if (body.purchases && body.purchases.length > 0) {
        updateData.purchases = JSON.stringify(body.purchases);
        updateData.cost = body.purchases.reduce((sum, p) => sum + (p.amount ?? 0), 0);
      } else {
        updateData.purchases = null;
        // Keep existing cost unless cost was also explicitly provided
        if (body.cost !== undefined) {
          updateData.cost = body.cost;
        }
      }
    } else if (body.cost !== undefined) {
      updateData.cost = body.cost;
    }

    const [updated] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();

    return c.json(serializeExpense(updated));
  },
);

// ─── DELETE /api/v1/expenses/:id ────────────────────────────────────────────

expensesRoute.delete('/api/v1/expenses/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [expense] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);

  if (!expense) {
    return c.json({ detail: 'Expense not found' }, 404);
  }

  // Check if month is closed
  const [month] = await db
    .select()
    .from(months)
    .where(eq(months.id, expense.month_id))
    .limit(1);

  if (month && month.is_closed) {
    return c.json({ detail: `Cannot delete expense: Month '${month.name}' is closed` }, 400);
  }

  await db.delete(expenses).where(eq(expenses.id, id));

  return c.json({ message: 'Expense deleted successfully' });
});

// ─── POST /api/v1/expenses/reorder ──────────────────────────────────────────

expensesRoute.post(
  '/api/v1/expenses/reorder',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', expenseReorderSchema),
  async (c) => {
    const { expense_ids } = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    if (expense_ids.length === 0) {
      return c.json({ detail: 'expense_ids cannot be empty' }, 400);
    }

    // Validate all expenses exist
    for (const expenseId of expense_ids) {
      const [exp] = await db
        .select({ id: expenses.id })
        .from(expenses)
        .where(eq(expenses.id, expenseId))
        .limit(1);
      if (!exp) {
        return c.json({ detail: `Expense with ID ${expenseId} not found` }, 404);
      }
    }

    // Update order sequentially
    const timestamp = now();
    for (let order = 0; order < expense_ids.length; order++) {
      const updateFields: Record<string, unknown> = { order, updated_at: timestamp };
      if (userName) {
        updateFields.updated_by = userName;
      }
      await db
        .update(expenses)
        .set(updateFields)
        .where(eq(expenses.id, expense_ids[order]));
    }

    // Return updated expenses in order
    const result: Array<ReturnType<typeof serializeExpense>> = [];
    for (const expenseId of expense_ids) {
      const [exp] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, expenseId))
        .limit(1);
      if (exp) {
        result.push(serializeExpense(exp));
      }
    }

    return c.json(result);
  },
);

// ─── POST /api/v1/expenses/:id/pay ─────────────────────────────────────────

expensesRoute.post(
  '/api/v1/expenses/:id/pay',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', payExpenseSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1);

    if (!expense) {
      return c.json({ detail: 'Expense not found' }, 404);
    }

    // Check if month is closed
    const [month] = await db
      .select()
      .from(months)
      .where(eq(months.id, expense.month_id))
      .limit(1);

    if (month && month.is_closed) {
      return c.json({ detail: `Cannot pay expense: Month '${month.name}' is closed` }, 400);
    }

    // Use provided amount or budget amount
    const paymentAmount = body.amount ?? expense.budget ?? 0;

    // Use provided name or default to "Payment"
    const entryName = body.name || 'Payment';

    // Build payment entry
    const paymentEntry = {
      name: entryName,
      amount: paymentAmount,
      date: today(),
    };

    // Get existing purchases or create new list
    const currentPurchases = parsePurchases(expense.purchases) ?? [];
    currentPurchases.push(paymentEntry);

    // Calculate total cost from all purchases
    const totalCost = currentPurchases.reduce((sum, p) => sum + (p.amount ?? 0), 0);

    const timestamp = now();
    const updateFields: Record<string, unknown> = {
      purchases: JSON.stringify(currentPurchases),
      cost: totalCost,
      updated_at: timestamp,
    };
    if (userName) {
      updateFields.updated_by = userName;
    }

    const [updated] = await db
      .update(expenses)
      .set(updateFields)
      .where(eq(expenses.id, id))
      .returning();

    return c.json(serializeExpense(updated));
  },
);

export default expensesRoute;
