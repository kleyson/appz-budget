import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Database } from 'bun:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import * as path from 'node:path';
import * as schema from './schema';

const dbPath = process.env.DATABASE_PATH || './data/budget.db';

let sqlite = new Database(dbPath);
// busy_timeout must come before journal_mode: switching to WAL needs an
// exclusive lock, and after a close/reopen the outgoing handle may still
// hold a shared lock briefly. This uses SQLite's own wait-and-retry loop
// instead of an arbitrary sleep.
sqlite.exec('PRAGMA busy_timeout = 5000');
sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');

let db: BunSQLiteDatabase<typeof schema> = drizzle(sqlite, { schema });

const initialMigrationTables = [
  'categories',
  'expenses',
  'income_types',
  'incomes',
  'months',
  'password_reset_tokens',
  'periods',
  'seed_records',
  'users',
];

// Run migrations at startup
const migrationsFolder = path.resolve(import.meta.dir, '../../drizzle');
seedExistingDb(sqlite);
migrate(db, { migrationsFolder });
console.log('[db] Migrations applied successfully');

/**
 * For databases created before Drizzle migrations were added:
 * Create the journal table and mark all existing migrations as applied
 * so migrate() doesn't try to re-create tables that already exist.
 */
function seedExistingDb(sqliteDb: Database): void {
  const hasJournal = sqliteDb
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'")
    .get();
  if (hasJournal) return;

  const existingTables = sqliteDb
    .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((row) => row.name);
  const hasInitialSchema = initialMigrationTables.every((table) => existingTables.includes(table));
  if (!hasInitialSchema) return;

  // Existing pre-migration database — seed the journal
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    );
  `);

  const journalPath = path.resolve(migrationsFolder, 'meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));

  for (const entry of journal.entries) {
    const sqlContent = fs.readFileSync(
      path.resolve(migrationsFolder, `${entry.tag}.sql`),
      'utf-8',
    );
    const hash = crypto.createHash('sha256').update(sqlContent).digest('hex');
    sqliteDb.exec(
      `INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('${hash}', ${entry.when})`,
    );
  }

  console.log('[db] Existing database detected — marked migrations as applied');
}

/**
 * Re-open the database connection after a restore.
 * Called by the backup service after overwriting the DB file.
 *
 * Returns the new sqlite instance so callers don't need live-binding access.
 */
function resetConnection(): Database {
  sqlite = new Database(dbPath);
  sqlite.exec('PRAGMA busy_timeout = 5000');
  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');
  db = drizzle(sqlite, { schema });
  seedExistingDb(sqlite);
  migrate(db, { migrationsFolder });
  return sqlite;
}

export { db, sqlite, resetConnection };
