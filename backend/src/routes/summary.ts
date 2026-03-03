/**
 * Summary / analytics routes.
 * Ported from backend-python-archive/controllers/summary_controller.py
 * and backend-python-archive/services/summary_service.py.
 */

import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';

import { db } from '../db/connection';
import { expenses, incomes, periods, months, categories } from '../db/schema';
import { apiKeyAuth } from '../middleware/api-key';
import { optionalAuth } from '../middleware/jwt';

type Variables = {
  userId: number;
  userName: string;
};

const summaryRoute = new Hono<{ Variables: Variables }>();

// ─── GET /api/v1/summary/totals ─────────────────────────────────────────────

summaryRoute.get('/api/v1/summary/totals', apiKeyAuth, optionalAuth, async (c) => {
  const period = c.req.query('period');
  const monthIdParam = c.req.query('month_id');

  // Build expense conditions
  const expenseConditions = [];
  const incomeConditions = [];

  if (monthIdParam) {
    const monthId = parseInt(monthIdParam, 10);
    expenseConditions.push(eq(expenses.month_id, monthId));
    incomeConditions.push(eq(incomes.month_id, monthId));
  }
  if (period) {
    expenseConditions.push(eq(expenses.period, period));
    incomeConditions.push(eq(incomes.period, period));
  }

  // Fetch expenses
  const expenseQuery = db.select().from(expenses);
  const expenseRows =
    expenseConditions.length > 0
      ? await expenseQuery.where(and(...expenseConditions))
      : await expenseQuery;

  // Fetch incomes
  const incomeQuery = db.select().from(incomes);
  const incomeRows =
    incomeConditions.length > 0
      ? await incomeQuery.where(and(...incomeConditions))
      : await incomeQuery;

  // Calculate totals
  const total_budget_expenses = expenseRows.reduce((sum, e) => sum + (e.budget ?? 0), 0);
  const total_current_expenses = expenseRows.reduce((sum, e) => sum + (e.cost ?? 0), 0);
  const total_budget_income = incomeRows.reduce((sum, i) => sum + (i.budget ?? 0), 0);
  const total_current_income = incomeRows.reduce((sum, i) => sum + (i.amount ?? 0), 0);

  return c.json({
    total_budget_expenses,
    total_current_expenses,
    total_budget_income,
    total_current_income,
    total_budget: total_budget_income - total_budget_expenses,
    total_current: total_current_income - total_current_expenses,
  });
});

// ─── GET /api/v1/summary/by-period ──────────────────────────────────────────

summaryRoute.get('/api/v1/summary/by-period', apiKeyAuth, optionalAuth, async (c) => {
  const monthIdParam = c.req.query('month_id');
  const monthId = monthIdParam ? parseInt(monthIdParam, 10) : undefined;

  // Get all periods
  const allPeriods = await db.select().from(periods);

  const periodSummaries = [];
  let grand_total_income = 0;
  let grand_total_expenses = 0;

  for (const period of allPeriods) {
    // Fetch expenses for this period
    const expenseConditions = [eq(expenses.period, period.name)];
    if (monthId !== undefined) expenseConditions.push(eq(expenses.month_id, monthId));

    const periodExpenses = await db
      .select()
      .from(expenses)
      .where(and(...expenseConditions));

    // Fetch incomes for this period
    const incomeConditions = [eq(incomes.period, period.name)];
    if (monthId !== undefined) incomeConditions.push(eq(incomes.month_id, monthId));

    const periodIncomes = await db
      .select()
      .from(incomes)
      .where(and(...incomeConditions));

    const total_income = periodIncomes.reduce((sum, i) => sum + (i.amount ?? 0), 0);
    const total_expenses = periodExpenses.reduce((sum, e) => sum + (e.cost ?? 0), 0);

    periodSummaries.push({
      period: period.name,
      color: period.color,
      total_income,
      total_expenses,
      difference: total_income - total_expenses,
    });

    grand_total_income += total_income;
    grand_total_expenses += total_expenses;
  }

  return c.json({
    periods: periodSummaries,
    grand_total_income,
    grand_total_expenses,
    grand_total_difference: grand_total_income - grand_total_expenses,
  });
});

// ─── GET /api/v1/summary/expenses-by-period ─────────────────────────────────

summaryRoute.get('/api/v1/summary/expenses-by-period', apiKeyAuth, optionalAuth, async (c) => {
  const monthIdParam = c.req.query('month_id');
  const monthId = monthIdParam ? parseInt(monthIdParam, 10) : undefined;

  // Get all periods
  const allPeriods = await db.select().from(periods);

  const periodSummaries = [];

  for (const period of allPeriods) {
    const conditions = [eq(expenses.period, period.name)];
    if (monthId !== undefined) conditions.push(eq(expenses.month_id, monthId));

    const periodExpenses = await db
      .select()
      .from(expenses)
      .where(and(...conditions));

    const budget = periodExpenses.reduce((sum, e) => sum + (e.budget ?? 0), 0);
    const total = periodExpenses.reduce((sum, e) => sum + (e.cost ?? 0), 0);

    periodSummaries.push({
      period: period.name,
      color: period.color,
      budget,
      total,
      over_budget: total > budget,
    });
  }

  return c.json(periodSummaries);
});

// ─── GET /api/v1/summary/monthly-trends ─────────────────────────────────────

summaryRoute.get('/api/v1/summary/monthly-trends', apiKeyAuth, optionalAuth, async (c) => {
  const numMonthsParam = c.req.query('num_months');
  let numMonths = numMonthsParam ? parseInt(numMonthsParam, 10) : 12;

  // Clamp to valid range
  if (numMonths < 1) numMonths = 1;
  if (numMonths > 24) numMonths = 24;

  // Get all months sorted by year/month descending, take N, then reverse to oldest-first
  const allMonths = await db
    .select()
    .from(months)
    .orderBy(desc(months.year), desc(months.month));

  const selectedMonths = allMonths.slice(0, numMonths).reverse();

  // Get all categories for color lookup
  const allCategories = await db.select().from(categories);
  const categoryColors: Record<string, string> = {};
  for (const cat of allCategories) {
    categoryColors[cat.name] = cat.color;
  }

  const monthlyData = [];
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalSavingsRate = 0;
  let monthsWithIncome = 0;

  for (const month of selectedMonths) {
    // Fetch expenses and incomes for this month
    const monthExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.month_id, month.id));

    const monthIncomes = await db
      .select()
      .from(incomes)
      .where(eq(incomes.month_id, month.id));

    const monthIncome = monthIncomes.reduce((sum, i) => sum + (i.amount ?? 0), 0);
    const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + (e.cost ?? 0), 0);
    const netSavings = monthIncome - monthExpenseTotal;

    // Calculate savings rate (avoid division by zero)
    let savingsRate = 0;
    if (monthIncome > 0) {
      savingsRate = (netSavings / monthIncome) * 100;
      monthsWithIncome += 1;
      totalSavingsRate += savingsRate;
    }

    // Group expenses by category
    const categoryTotals: Record<string, number> = {};
    for (const expense of monthExpenses) {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] ?? 0) + (expense.cost ?? 0);
    }

    const categoryItems = Object.entries(categoryTotals).map(([catName, amount]) => ({
      category: catName,
      amount,
      color: categoryColors[catName] ?? '#8b5cf6',
    }));

    monthlyData.push({
      month_id: month.id,
      month_name: month.name,
      year: month.year,
      month: month.month,
      total_income: monthIncome,
      total_expenses: monthExpenseTotal,
      net_savings: netSavings,
      savings_rate: Math.round(savingsRate * 10) / 10,
      categories: categoryItems,
    });

    totalIncome += monthIncome;
    totalExpenses += monthExpenseTotal;
  }

  // Calculate averages
  const numDataMonths = monthlyData.length || 1;
  const avgIncome = totalIncome / numDataMonths;
  const avgExpenses = totalExpenses / numDataMonths;
  const avgSavingsRate = monthsWithIncome > 0 ? totalSavingsRate / monthsWithIncome : 0;

  return c.json({
    months: monthlyData,
    average_income: Math.round(avgIncome * 100) / 100,
    average_expenses: Math.round(avgExpenses * 100) / 100,
    average_savings_rate: Math.round(avgSavingsRate * 10) / 10,
  });
});

// ─── GET /api/v1/summary/insights ───────────────────────────────────────────

summaryRoute.get('/api/v1/summary/insights', apiKeyAuth, optionalAuth, async (c) => {
  const monthIdParam = c.req.query('month_id');

  // Resolve current month
  let currentMonth;
  if (monthIdParam) {
    const rows = await db
      .select()
      .from(months)
      .where(eq(months.id, parseInt(monthIdParam, 10)));
    currentMonth = rows[0];
  } else {
    // Default to most recent month
    const rows = await db
      .select()
      .from(months)
      .orderBy(desc(months.year), desc(months.month))
      .limit(1);
    currentMonth = rows[0];
  }

  if (!currentMonth) {
    return c.json({
      insights: [],
      savings_projection: 0,
      budget_health: 'good' as const,
      over_budget_count: 0,
      total_categories: 0,
    });
  }

  // Find previous month
  const allMonths = await db
    .select()
    .from(months)
    .orderBy(desc(months.year), desc(months.month));

  const currentIdx = allMonths.findIndex((m) => m.id === currentMonth.id);
  const previousMonth = currentIdx >= 0 && currentIdx + 1 < allMonths.length
    ? allMonths[currentIdx + 1]
    : null;

  // Fetch current month expenses and incomes
  const currentExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.month_id, currentMonth.id));

  const currentIncomes = await db
    .select()
    .from(incomes)
    .where(eq(incomes.month_id, currentMonth.id));

  // Fetch previous month expenses (if exists)
  const previousExpenses = previousMonth
    ? await db
        .select()
        .from(expenses)
        .where(eq(expenses.month_id, previousMonth.id))
    : [];

  // ── Aggregate by category ──────────────────────────────────────────────
  type CategoryAgg = { cost: number; budget: number };

  const currentByCategory: Record<string, CategoryAgg> = {};
  for (const e of currentExpenses) {
    const cat = e.category;
    if (!currentByCategory[cat]) currentByCategory[cat] = { cost: 0, budget: 0 };
    currentByCategory[cat].cost += e.cost ?? 0;
    currentByCategory[cat].budget += e.budget ?? 0;
  }

  const previousByCategory: Record<string, number> = {};
  for (const e of previousExpenses) {
    previousByCategory[e.category] = (previousByCategory[e.category] ?? 0) + (e.cost ?? 0);
  }

  // ── Income totals ─────────────────────────────────────────────────────
  const totalCurrentIncome = currentIncomes.reduce((s, i) => s + (i.amount ?? 0), 0);
  const totalBudgetIncome = currentIncomes.reduce((s, i) => s + (i.budget ?? 0), 0);
  const totalCurrentExpenses = currentExpenses.reduce((s, e) => s + (e.cost ?? 0), 0);
  const totalBudgetExpenses = currentExpenses.reduce((s, e) => s + (e.budget ?? 0), 0);

  // ── Generate insights ─────────────────────────────────────────────────

  type Insight = {
    type: 'warning' | 'positive' | 'neutral';
    icon: string;
    message: string;
    category?: string;
  };

  const warnings: Insight[] = [];
  const positives: Insight[] = [];
  const neutrals: Insight[] = [];

  const categoryNames = Object.keys(currentByCategory);
  const totalCategories = categoryNames.length;

  // 1. Category comparison vs previous month
  if (previousMonth) {
    for (const cat of categoryNames) {
      const prevSpend = previousByCategory[cat] ?? 0;
      const currSpend = currentByCategory[cat].cost;
      if (prevSpend > 0 && currSpend > prevSpend) {
        const pctIncrease = Math.round(((currSpend - prevSpend) / prevSpend) * 100);
        if (pctIncrease > 20) {
          warnings.push({
            type: 'warning',
            icon: 'trending-up',
            message: `You've spent ${pctIncrease}% more on ${cat} compared to last month`,
            category: cat,
          });
        }
      }
    }
  }

  // 2. Over-budget categories
  let overBudgetCount = 0;
  for (const cat of categoryNames) {
    const agg = currentByCategory[cat];
    if (agg.budget > 0 && agg.cost > agg.budget) {
      overBudgetCount++;
    }
  }

  if (overBudgetCount > 0) {
    warnings.push({
      type: 'warning',
      icon: 'alert',
      message: `${overBudgetCount} of ${totalCategories} categories are over their budget amount`,
    });
  }

  // 3. Savings projection
  const savingsProjection = Math.round((totalCurrentIncome - totalCurrentExpenses) * 100) / 100;

  if (savingsProjection > 0) {
    positives.push({
      type: 'positive',
      icon: 'trending-up',
      message: `You're on track to save $${savingsProjection.toFixed(2)} this month`,
    });
  } else if (savingsProjection < 0) {
    warnings.push({
      type: 'warning',
      icon: 'trending-down',
      message: `You're currently overspending by $${Math.abs(savingsProjection).toFixed(2)} this month`,
    });
  }

  // 4. Budget health
  let budgetHealth: 'good' | 'warning' | 'critical';
  if (totalBudgetExpenses > 0) {
    const spentPct = (totalCurrentExpenses / totalBudgetExpenses) * 100;
    if (spentPct > 100) budgetHealth = 'critical';
    else if (spentPct >= 80) budgetHealth = 'warning';
    else budgetHealth = 'good';
  } else {
    budgetHealth = 'good';
  }

  // 5. Under-spent categories
  for (const cat of categoryNames) {
    const agg = currentByCategory[cat];
    if (agg.budget > 0) {
      const usedPct = Math.round((agg.cost / agg.budget) * 100);
      if (usedPct < 50) {
        neutrals.push({
          type: 'neutral',
          icon: 'info',
          message: `${cat} is well under budget (${usedPct}% used)`,
          category: cat,
        });
      }
    }
  }

  // 6. Income tracking
  if (totalBudgetIncome > 0 && totalCurrentIncome > totalBudgetIncome) {
    const abovePct = Math.round(
      ((totalCurrentIncome - totalBudgetIncome) / totalBudgetIncome) * 100,
    );
    positives.push({
      type: 'positive',
      icon: 'check',
      message: `Income is ${abovePct}% above budget`,
    });
  }

  // Combine and limit to top 5 (warnings first, then positives, then neutral)
  const allInsights = [...warnings, ...positives, ...neutrals].slice(0, 5);

  return c.json({
    insights: allInsights,
    savings_projection: savingsProjection,
    budget_health: budgetHealth,
    over_budget_count: overBudgetCount,
    total_categories: totalCategories,
  });
});

export default summaryRoute;
