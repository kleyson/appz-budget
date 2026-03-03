import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

const dbPath = process.env.DATABASE_PATH || './data/budget.db';

let sqlite = new Database(dbPath);
sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');

let db: BunSQLiteDatabase<typeof schema> = drizzle(sqlite, { schema });

/**
 * Re-open the database connection after a restore.
 * Called by the backup service after overwriting the DB file.
 *
 * Returns the new sqlite instance so callers don't need live-binding access.
 */
function resetConnection(): Database {
  sqlite = new Database(dbPath);
  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');
  db = drizzle(sqlite, { schema });
  return sqlite;
}

export { db, sqlite, resetConnection };
