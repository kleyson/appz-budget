/**
 * Month CRUD routes with close/open and clone functionality.
 * Ported from backend-python-archive/controllers/month_controller.py
 * and backend-python-archive/services/month_service.py.
 */

import { Hono } from 'hono';
import { eq, and, desc, asc } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';

import { db } from '../db/connection';
import { months, expenses, incomes } from '../db/schema';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';
import { monthCreateSchema, monthUpdateSchema } from '../types/schemas';

type Variables = {
  userId: number;
  userName: string;
};

const monthsRoute = new Hono<{ Variables: Variables }>();

function now(): string {
  return new Date().toISOString();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function generateMonthName(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function getMonthDates(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  // Last day of month: create date for first day of next month, then subtract one day
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

// ─── GET /api/v1/months ─────────────────────────────────────────────────────

monthsRoute.get('/api/v1/months', apiKeyAuth, optionalAuth, async (c) => {
  const rows = await db
    .select()
    .from(months)
    .orderBy(desc(months.year), desc(months.month));

  return c.json(rows);
});

// ─── GET /api/v1/months/current ─────────────────────────────────────────────

monthsRoute.get('/api/v1/months/current', apiKeyAuth, optionalAuth, async (c) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Try to find the current month
  const [month] = await db
    .select()
    .from(months)
    .where(and(eq(months.year, currentYear), eq(months.month, currentMonth)))
    .limit(1);

  if (month) {
    return c.json(month);
  }

  // Fall back to the most recent month
  const [mostRecent] = await db
    .select()
    .from(months)
    .orderBy(desc(months.year), desc(months.month))
    .limit(1);

  if (!mostRecent) {
    return c.json({ detail: 'No months found in database' }, 404);
  }

  return c.json(mostRecent);
});

// ─── GET /api/v1/months/year/:year/month/:month ─────────────────────────────

monthsRoute.get('/api/v1/months/year/:year/month/:month', apiKeyAuth, optionalAuth, async (c) => {
  const year = parseInt(c.req.param('year'), 10);
  const monthNum = parseInt(c.req.param('month'), 10);

  const [month] = await db
    .select()
    .from(months)
    .where(and(eq(months.year, year), eq(months.month, monthNum)))
    .limit(1);

  if (!month) {
    return c.json({ detail: `Month ${year}-${String(monthNum).padStart(2, '0')} not found` }, 404);
  }

  return c.json(month);
});

// ─── GET /api/v1/months/:id ─────────────────────────────────────────────────

monthsRoute.get('/api/v1/months/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [month] = await db
    .select()
    .from(months)
    .where(eq(months.id, id))
    .limit(1);

  if (!month) {
    return c.json({ detail: `Month with ID ${id} not found` }, 404);
  }

  return c.json(month);
});

// ─── POST /api/v1/months ────────────────────────────────────────────────────

monthsRoute.post(
  '/api/v1/months',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', monthCreateSchema),
  async (c) => {
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    // Check if month already exists for this year+month combo
    const [existing] = await db
      .select()
      .from(months)
      .where(and(eq(months.year, body.year), eq(months.month, body.month)))
      .limit(1);

    if (existing) {
      return c.json(
        { detail: `Month ${generateMonthName(body.year, body.month)} already exists` },
        409,
      );
    }

    const name = generateMonthName(body.year, body.month);
    const { startDate, endDate } = getMonthDates(body.year, body.month);
    const timestamp = now();

    const [created] = await db
      .insert(months)
      .values({
        year: body.year,
        month: body.month,
        name,
        start_date: startDate,
        end_date: endDate,
        is_closed: false,
        created_at: timestamp,
        updated_at: timestamp,
        created_by: userName ?? null,
        updated_by: userName ?? null,
      })
      .returning();

    return c.json(created, 201);
  },
);

// ─── PUT /api/v1/months/:id ─────────────────────────────────────────────────

monthsRoute.put(
  '/api/v1/months/:id',
  apiKeyAuth,
  optionalAuth,
  zValidator('json', monthUpdateSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const body = c.req.valid('json');
    const userName = c.get('userName') as string | undefined;

    const [month] = await db
      .select()
      .from(months)
      .where(eq(months.id, id))
      .limit(1);

    if (!month) {
      return c.json({ detail: `Month with ID ${id} not found` }, 404);
    }

    const updateData: Record<string, unknown> = {
      updated_at: now(),
      updated_by: userName ?? null,
    };

    // If year or month is being updated, regenerate name and dates
    if (body.year !== undefined || body.month !== undefined) {
      const year = body.year ?? month.year;
      const monthNum = body.month ?? month.month;

      // Check if new year+month combo already exists (and is different from current)
      if (year !== month.year || monthNum !== month.month) {
        const [existing] = await db
          .select()
          .from(months)
          .where(and(eq(months.year, year), eq(months.month, monthNum)))
          .limit(1);

        if (existing) {
          return c.json(
            { detail: `Month ${generateMonthName(year, monthNum)} already exists` },
            409,
          );
        }
      }

      const { startDate, endDate } = getMonthDates(year, monthNum);
      updateData.year = year;
      updateData.month = monthNum;
      updateData.name = generateMonthName(year, monthNum);
      updateData.start_date = startDate;
      updateData.end_date = endDate;
    }

    // Allow direct overrides for name, start_date, end_date if provided
    if (body.name !== undefined && updateData.name === undefined) updateData.name = body.name;
    if (body.start_date !== undefined && updateData.start_date === undefined)
      updateData.start_date = body.start_date;
    if (body.end_date !== undefined && updateData.end_date === undefined)
      updateData.end_date = body.end_date;

    const [updated] = await db
      .update(months)
      .set(updateData)
      .where(eq(months.id, id))
      .returning();

    return c.json(updated);
  },
);

// ─── DELETE /api/v1/months/:id ──────────────────────────────────────────────

monthsRoute.delete('/api/v1/months/:id', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  const [month] = await db
    .select()
    .from(months)
    .where(eq(months.id, id))
    .limit(1);

  if (!month) {
    return c.json({ detail: `Month with ID ${id} not found` }, 404);
  }

  // Delete all associated expenses first
  await db.delete(expenses).where(eq(expenses.month_id, id));

  // Delete all associated incomes
  await db.delete(incomes).where(eq(incomes.month_id, id));

  // Delete the month itself
  await db.delete(months).where(eq(months.id, id));

  return c.json({ message: 'Month deleted successfully' });
});

// ─── POST /api/v1/months/:id/close ──────────────────────────────────────────

monthsRoute.post('/api/v1/months/:id/close', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const userName = c.get('userName') as string | undefined;

  const [month] = await db
    .select()
    .from(months)
    .where(eq(months.id, id))
    .limit(1);

  if (!month) {
    return c.json({ detail: `Month with ID ${id} not found` }, 404);
  }

  if (month.is_closed) {
    return c.json({ detail: `Month ${month.name} is already closed` }, 400);
  }

  const timestamp = now();
  const [updated] = await db
    .update(months)
    .set({
      is_closed: true,
      closed_at: timestamp,
      closed_by: userName ?? null,
      updated_at: timestamp,
      updated_by: userName ?? null,
    })
    .where(eq(months.id, id))
    .returning();

  return c.json({ ...updated, message: `Month ${updated.name} has been closed` });
});

// ─── POST /api/v1/months/:id/open ───────────────────────────────────────────

monthsRoute.post('/api/v1/months/:id/open', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const userName = c.get('userName') as string | undefined;

  const [month] = await db
    .select()
    .from(months)
    .where(eq(months.id, id))
    .limit(1);

  if (!month) {
    return c.json({ detail: `Month with ID ${id} not found` }, 404);
  }

  if (!month.is_closed) {
    return c.json({ detail: `Month ${month.name} is not closed` }, 400);
  }

  const timestamp = now();
  const [updated] = await db
    .update(months)
    .set({
      is_closed: false,
      closed_at: null,
      closed_by: null,
      updated_at: timestamp,
      updated_by: userName ?? null,
    })
    .where(eq(months.id, id))
    .returning();

  return c.json({ ...updated, message: `Month ${updated.name} has been reopened` });
});

// ─── POST /api/v1/months/:id/clone ──────────────────────────────────────────

monthsRoute.post('/api/v1/months/:id/clone', apiKeyAuth, optionalAuth, async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const userName = c.get('userName') as string | undefined;

  // Get the source month
  const [sourceMonth] = await db
    .select()
    .from(months)
    .where(eq(months.id, id))
    .limit(1);

  if (!sourceMonth) {
    return c.json({ detail: `Month with ID ${id} not found` }, 404);
  }

  // Calculate next month
  let nextYear = sourceMonth.year;
  let nextMonthNum = sourceMonth.month + 1;
  if (nextMonthNum > 12) {
    nextMonthNum = 1;
    nextYear += 1;
  }

  // Get or create the next month
  let [nextMonth] = await db
    .select()
    .from(months)
    .where(and(eq(months.year, nextYear), eq(months.month, nextMonthNum)))
    .limit(1);

  if (!nextMonth) {
    const nextName = generateMonthName(nextYear, nextMonthNum);
    const { startDate, endDate } = getMonthDates(nextYear, nextMonthNum);
    const timestamp = now();

    [nextMonth] = await db
      .insert(months)
      .values({
        year: nextYear,
        month: nextMonthNum,
        name: nextName,
        start_date: startDate,
        end_date: endDate,
        is_closed: false,
        created_at: timestamp,
        updated_at: timestamp,
        created_by: userName ?? null,
        updated_by: userName ?? null,
      })
      .returning();
  }

  // Clone expenses from source month
  const sourceExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.month_id, id))
    .orderBy(asc(expenses.order), asc(expenses.expense_name));

  let clonedCount = 0;
  const timestamp = now();
  for (const expense of sourceExpenses) {
    await db.insert(expenses).values({
      expense_name: expense.expense_name,
      period: expense.period,
      category: expense.category,
      budget: expense.budget,
      cost: 0,
      notes: expense.notes,
      month_id: nextMonth.id,
      purchases: null,
      order: expense.order,
      expense_date: null,
      created_at: timestamp,
      updated_at: timestamp,
      created_by: userName ?? null,
      updated_by: userName ?? null,
    });
    clonedCount += 1;
  }

  // Clone incomes from source month
  const sourceIncomes = await db
    .select()
    .from(incomes)
    .where(eq(incomes.month_id, id));

  let clonedIncomeCount = 0;
  for (const income of sourceIncomes) {
    await db.insert(incomes).values({
      income_type_id: income.income_type_id,
      period: income.period,
      budget: income.budget,
      amount: 0,
      month_id: nextMonth.id,
      created_at: timestamp,
      updated_at: timestamp,
      created_by: userName ?? null,
      updated_by: userName ?? null,
    });
    clonedIncomeCount += 1;
  }

  // Build success message
  const parts: string[] = [];
  if (clonedCount > 0) parts.push(`${clonedCount} expense(s)`);
  if (clonedIncomeCount > 0) parts.push(`${clonedIncomeCount} income(s)`);

  const message = parts.length > 0
    ? `Successfully cloned ${parts.join(', ')} to ${nextMonth.name}`
    : `No data to clone for ${nextMonth.name}`;

  return c.json({
    message,
    cloned_count: clonedCount,
    cloned_income_count: clonedIncomeCount,
    next_month_id: nextMonth.id,
    next_month_name: nextMonth.name,
  });
});

export default monthsRoute;
