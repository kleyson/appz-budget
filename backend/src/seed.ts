/**
 * Seed script — creates initial admin user and default data.
 *
 * Usage:
 *   bun run src/seed.ts
 *
 * Idempotent via the seed_records table: a row with
 * seed_id = 'initial_data_v1' marks the initial seed as complete and
 * subsequent runs become a no-op.
 */

import { eq } from 'drizzle-orm';
import { db, sqlite } from './db/connection';
import {
  categories,
  incomeTypes,
  months,
  periods,
  seedRecords,
  users,
} from './db/schema';
import { hashPassword } from './utils/auth';

const SEED_INITIAL_DATA = 'initial_data_v1';

const ADMIN_EMAIL = 'admin@email.com';
const ADMIN_PASSWORD = 'admin1';
const ADMIN_NAME = 'Administrator';

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Transportation',
  'Insurance',
  'Subscriptions',
  'Rent/Utilities',
  'Going Out',
  'Purchases',
  'Health',
  'Investment/Savings',
  'Withdraw',
];

const DEFAULT_INCOME_TYPES = [
  'Salary',
  'Carry Over',
  'Side Hustle',
  'Tax Return',
  'Investment Return',
  'Bonus',
];

const DEFAULT_PERIODS = ['On Demand', '1st Period', '2nd Period'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function now(): string {
  return new Date().toISOString();
}

/** #rrggbb with each channel in [50, 255] for good visibility. */
function randomColor(): string {
  const channel = () => Math.floor(Math.random() * (255 - 50 + 1)) + 50;
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${hex(channel())}${hex(channel())}${hex(channel())}`;
}

async function hasSeedRun(seedId: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(seedRecords)
    .where(eq(seedRecords.seed_id, seedId))
    .limit(1);
  return !!row;
}

async function markSeedComplete(seedId: string): Promise<void> {
  await db.insert(seedRecords).values({ seed_id: seedId, executed_at: now() });
}

async function seedAdminUser(): Promise<void> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (existing) {
    if (!existing.is_admin) {
      await db.update(users).set({ is_admin: true, updated_at: now() }).where(eq(users.id, existing.id));
      console.log('✓ Existing admin user updated to have admin privileges');
    } else {
      console.log('  Admin user already exists — skipping');
    }
    return;
  }

  const hashed = await hashPassword(ADMIN_PASSWORD);
  const timestamp = now();
  await db.insert(users).values({
    email: ADMIN_EMAIL,
    hashed_password: hashed,
    full_name: ADMIN_NAME,
    is_active: true,
    is_admin: true,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: 'system',
    updated_by: 'system',
  });
  console.log('✓ Admin user created');
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
}

async function seedCurrentMonth(): Promise<void> {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const name = `${MONTH_NAMES[month - 1]} ${year}`;

  const [existing] = await db
    .select()
    .from(months)
    .where(eq(months.name, name))
    .limit(1);
  if (existing) {
    console.log(`  Current month (${name}) already exists — skipping`);
    return;
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const timestamp = now();
  await db.insert(months).values({
    year,
    month,
    name,
    start_date: startDate,
    end_date: endDate,
    is_closed: false,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: 'system',
    updated_by: 'system',
  });
  console.log(`✓ Current month (${name}) created`);
}

async function seedCategories(): Promise<void> {
  let created = 0;
  let skipped = 0;
  const timestamp = now();

  for (const name of DEFAULT_CATEGORIES) {
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    if (existing) {
      skipped++;
      continue;
    }
    await db.insert(categories).values({
      name,
      color: randomColor(),
      created_at: timestamp,
      updated_at: timestamp,
      created_by: 'system',
      updated_by: 'system',
    });
    created++;
  }

  if (created > 0) console.log(`✓ Created ${created} categories`);
  if (skipped > 0) console.log(`  ${skipped} categories already exist`);
}

async function seedIncomeTypes(): Promise<void> {
  let created = 0;
  let skipped = 0;
  const timestamp = now();

  for (const name of DEFAULT_INCOME_TYPES) {
    const [existing] = await db
      .select()
      .from(incomeTypes)
      .where(eq(incomeTypes.name, name))
      .limit(1);
    if (existing) {
      skipped++;
      continue;
    }
    await db.insert(incomeTypes).values({
      name,
      color: randomColor(),
      created_at: timestamp,
      updated_at: timestamp,
      created_by: 'system',
      updated_by: 'system',
    });
    created++;
  }

  if (created > 0) console.log(`✓ Created ${created} income types`);
  if (skipped > 0) console.log(`  ${skipped} income types already exist`);
}

async function seedPeriods(): Promise<void> {
  let created = 0;
  let skipped = 0;
  const timestamp = now();

  for (const name of DEFAULT_PERIODS) {
    const [existing] = await db
      .select()
      .from(periods)
      .where(eq(periods.name, name))
      .limit(1);
    if (existing) {
      skipped++;
      continue;
    }
    await db.insert(periods).values({
      name,
      color: randomColor(),
      created_at: timestamp,
      updated_at: timestamp,
      created_by: 'system',
      updated_by: 'system',
    });
    created++;
  }

  if (created > 0) console.log(`✓ Created ${created} periods`);
  if (skipped > 0) console.log(`  ${skipped} periods already exist`);
}

async function main(): Promise<void> {
  if (await hasSeedRun(SEED_INITIAL_DATA)) {
    console.log(`Seed '${SEED_INITIAL_DATA}' has already run — skipping`);
    return;
  }

  console.log('Seeding initial data…\n');
  await seedAdminUser();
  console.log();
  await seedCurrentMonth();
  console.log();
  await seedCategories();
  console.log();
  await seedIncomeTypes();
  console.log();
  await seedPeriods();
  console.log();

  await markSeedComplete(SEED_INITIAL_DATA);
  console.log(`✓ Seed '${SEED_INITIAL_DATA}' complete`);
}

main()
  .then(() => {
    sqlite.close();
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    try {
      sqlite.close();
    } catch {
      // ignore
    }
    process.exit(1);
  });
