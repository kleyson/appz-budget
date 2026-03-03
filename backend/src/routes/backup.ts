/**
 * Backup routes — export and restore all data as JSON.
 */

import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { categories, periods, incomeTypes, months, expenses, incomes } from '../db/schema';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';

const backupRoute = new Hono();

/**
 * Collect all data from all tables into a single JSON object.
 */
async function collectAllData() {
  const [allCategories, allPeriods, allIncomeTypes, allMonths, allExpenses, allIncomes] =
    await Promise.all([
      db.select().from(categories),
      db.select().from(periods),
      db.select().from(incomeTypes),
      db.select().from(months),
      db.select().from(expenses),
      db.select().from(incomes),
    ]);

  return {
    categories: allCategories,
    periods: allPeriods,
    income_types: allIncomeTypes,
    months: allMonths,
    expenses: allExpenses,
    incomes: allIncomes,
  };
}

// ─── GET /api/v1/backup ─────────────────────────────────────────────────────

backupRoute.get('/api/v1/backup', apiKeyAuth, optionalAuth, async (c) => {
  const data = await collectAllData();
  return c.json(data);
});

// ─── GET /api/v1/backup/download ────────────────────────────────────────────

backupRoute.get('/api/v1/backup/download', apiKeyAuth, optionalAuth, async (c) => {
  const data = await collectAllData();
  const json = JSON.stringify(data, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `budget-backup-${timestamp}.json`;

  return new Response(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});

// ─── POST /api/v1/backup/restore ────────────────────────────────────────────

backupRoute.post('/api/v1/backup/restore', apiKeyAuth, optionalAuth, async (c) => {
  const contentType = c.req.header('Content-Type') || '';
  let data: Record<string, unknown[]>;

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json({ detail: 'No file uploaded' }, 400);
    }
    const text = await file.text();
    try {
      data = JSON.parse(text);
    } catch {
      return c.json({ detail: 'Invalid JSON file' }, 400);
    }
  } else {
    try {
      data = await c.req.json();
    } catch {
      return c.json({ detail: 'Invalid JSON body' }, 400);
    }
  }

  const userName = c.req.header('X-User-Name') ?? 'restore';
  const timestamp = new Date().toISOString();
  const stats: Record<string, number> = {};

  try {
    // Delete existing data in reverse dependency order
    await db.delete(expenses);
    await db.delete(incomes);
    await db.delete(months);
    await db.delete(categories);
    await db.delete(periods);
    await db.delete(incomeTypes);

    // Restore categories
    if (data.categories && Array.isArray(data.categories)) {
      let count = 0;
      for (const cat of data.categories as Record<string, unknown>[]) {
        await db.insert(categories).values({
          name: cat.name as string,
          color: (cat.color as string) ?? '#8b5cf6',
          created_at: (cat.created_at as string) ?? timestamp,
          updated_at: (cat.updated_at as string) ?? timestamp,
          created_by: (cat.created_by as string) ?? userName,
          updated_by: (cat.updated_by as string) ?? userName,
        });
        count++;
      }
      stats.categories = count;
    }

    // Restore periods
    if (data.periods && Array.isArray(data.periods)) {
      let count = 0;
      for (const p of data.periods as Record<string, unknown>[]) {
        await db.insert(periods).values({
          name: p.name as string,
          color: (p.color as string) ?? '#8b5cf6',
          created_at: (p.created_at as string) ?? timestamp,
          updated_at: (p.updated_at as string) ?? timestamp,
          created_by: (p.created_by as string) ?? userName,
          updated_by: (p.updated_by as string) ?? userName,
        });
        count++;
      }
      stats.periods = count;
    }

    // Restore income types
    if (data.income_types && Array.isArray(data.income_types)) {
      let count = 0;
      for (const it of data.income_types as Record<string, unknown>[]) {
        await db.insert(incomeTypes).values({
          name: it.name as string,
          color: (it.color as string) ?? '#10b981',
          created_at: (it.created_at as string) ?? timestamp,
          updated_at: (it.updated_at as string) ?? timestamp,
          created_by: (it.created_by as string) ?? userName,
          updated_by: (it.updated_by as string) ?? userName,
        });
        count++;
      }
      stats.income_types = count;
    }

    // Restore months
    // Build a map of old month IDs to new month IDs for expense/income FK resolution
    const monthIdMap = new Map<number, number>();
    if (data.months && Array.isArray(data.months)) {
      let count = 0;
      for (const m of data.months as Record<string, unknown>[]) {
        const [inserted] = await db.insert(months).values({
          year: m.year as number,
          month: m.month as number,
          name: m.name as string,
          start_date: m.start_date as string,
          end_date: m.end_date as string,
          is_closed: (m.is_closed as boolean) ?? false,
          closed_at: (m.closed_at as string) ?? null,
          closed_by: (m.closed_by as string) ?? null,
          created_at: (m.created_at as string) ?? timestamp,
          updated_at: (m.updated_at as string) ?? timestamp,
          created_by: (m.created_by as string) ?? userName,
          updated_by: (m.updated_by as string) ?? userName,
        }).returning();
        monthIdMap.set(m.id as number, inserted.id);
        count++;
      }
      stats.months = count;
    }

    // Build income type ID map for income FK resolution
    const incomeTypeIdMap = new Map<number, number>();
    if (data.income_types && Array.isArray(data.income_types)) {
      const allTypes = await db.select().from(incomeTypes);
      for (const it of data.income_types as Record<string, unknown>[]) {
        const match = allTypes.find((t) => t.name === (it.name as string));
        if (match) {
          incomeTypeIdMap.set(it.id as number, match.id);
        }
      }
    }

    // Restore expenses
    if (data.expenses && Array.isArray(data.expenses)) {
      let count = 0;
      for (const exp of data.expenses as Record<string, unknown>[]) {
        const newMonthId = monthIdMap.get(exp.month_id as number);
        if (!newMonthId) continue;

        await db.insert(expenses).values({
          expense_name: exp.expense_name as string,
          period: exp.period as string,
          category: exp.category as string,
          budget: (exp.budget as number) ?? 0,
          cost: (exp.cost as number) ?? 0,
          notes: (exp.notes as string) ?? null,
          month_id: newMonthId,
          order: (exp.order as number) ?? 0,
          purchases: (exp.purchases as string) ?? null,
          expense_date: (exp.expense_date as string) ?? null,
          created_at: (exp.created_at as string) ?? timestamp,
          updated_at: (exp.updated_at as string) ?? timestamp,
          created_by: (exp.created_by as string) ?? userName,
          updated_by: (exp.updated_by as string) ?? userName,
        });
        count++;
      }
      stats.expenses = count;
    }

    // Restore incomes
    if (data.incomes && Array.isArray(data.incomes)) {
      let count = 0;
      for (const inc of data.incomes as Record<string, unknown>[]) {
        const newMonthId = monthIdMap.get(inc.month_id as number);
        const newIncomeTypeId = incomeTypeIdMap.get(inc.income_type_id as number);
        if (!newMonthId || !newIncomeTypeId) continue;

        await db.insert(incomes).values({
          income_type_id: newIncomeTypeId,
          period: inc.period as string,
          budget: (inc.budget as number) ?? 0,
          amount: (inc.amount as number) ?? 0,
          month_id: newMonthId,
          created_at: (inc.created_at as string) ?? timestamp,
          updated_at: (inc.updated_at as string) ?? timestamp,
          created_by: (inc.created_by as string) ?? userName,
          updated_by: (inc.updated_by as string) ?? userName,
        });
        count++;
      }
      stats.incomes = count;
    }

    return c.json({
      message: 'Restore completed successfully',
      restored: stats,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return c.json({ detail: `Restore failed: ${detail}` }, 400);
  }
});

export default backupRoute;
