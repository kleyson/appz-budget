/**
 * Bun test preload script.
 * Sets environment variables and creates the test database ONCE
 * before any test file or backend module is imported.
 */

import { Database } from 'bun:sqlite';
import { resolve } from 'path';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB_PATH = resolve(import.meta.dir, 'test.db');

// ─── Set env vars BEFORE any backend code loads ─────────────────────────────

process.env.DATABASE_PATH = TEST_DB_PATH;
process.env.API_KEY = 'test-api-key';
process.env.JWT_SECRET_KEY = 'test-jwt-secret';
process.env.ENV = 'test';

// ─── Create DB if it doesn't exist (idempotent) ────────────────────────────

// Remove stale DB from previous run
try { unlinkSync(TEST_DB_PATH); } catch { /* ignore */ }
try { unlinkSync(TEST_DB_PATH + '-wal'); } catch { /* ignore */ }
try { unlinkSync(TEST_DB_PATH + '-shm'); } catch { /* ignore */ }

const sqlite = new Database(TEST_DB_PATH);
sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  full_name TEXT,
  is_active INTEGER DEFAULT 1,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  short_code TEXT,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#8b5cf6',
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS income_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#10b981',
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS months (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  name TEXT NOT NULL UNIQUE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_closed INTEGER DEFAULT 0,
  closed_at TEXT,
  closed_by TEXT,
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_name TEXT NOT NULL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  budget REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  notes TEXT,
  month_id INTEGER NOT NULL REFERENCES months(id),
  "order" INTEGER DEFAULT 0,
  purchases TEXT,
  expense_date TEXT,
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS incomes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  income_type_id INTEGER NOT NULL REFERENCES income_types(id),
  period TEXT NOT NULL,
  budget REAL DEFAULT 0,
  amount REAL DEFAULT 0,
  month_id INTEGER NOT NULL REFERENCES months(id),
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS seed_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seed_id TEXT NOT NULL UNIQUE,
  executed_at TEXT NOT NULL
);
`;

for (const statement of CREATE_TABLES_SQL.split(';').filter((s) => s.trim())) {
  sqlite.exec(statement + ';');
}

sqlite.close();
