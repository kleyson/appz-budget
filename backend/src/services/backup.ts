/**
 * Backup service — SQLite file backup management.
 *
 * Creates compacted copies of the database using VACUUM INTO,
 * lists/deletes backups, and supports restore-from-backup.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  copyFileSync,
  writeFileSync,
} from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { Database } from 'bun:sqlite';
import { config } from '../config';
import { sqlite, resetConnection } from '../db/connection';

const BACKUP_DIR = resolve(config.database.path, '..', 'backups');

export interface BackupFile {
  filename: string;
  size: number;
  created_at: string;
}

/** Ensure the backups directory exists. */
export function ensureBackupDir(): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/** Create a compacted backup using VACUUM INTO. */
export function createBackup(): BackupFile {
  ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `budget-backup-${timestamp}.db`;
  const destPath = join(BACKUP_DIR, filename);

  sqlite.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  sqlite.exec(`VACUUM INTO '${destPath}'`);

  const stat = statSync(destPath);
  return {
    filename,
    size: stat.size,
    created_at: stat.birthtime.toISOString(),
  };
}

/** List all backups sorted newest first. */
export function listBackups(): BackupFile[] {
  ensureBackupDir();

  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('budget-backup-') && f.endsWith('.db'));

  const backups: BackupFile[] = files.map((filename) => {
    const stat = statSync(join(BACKUP_DIR, filename));
    return {
      filename,
      size: stat.size,
      created_at: stat.birthtime.toISOString(),
    };
  });

  // Newest first
  backups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return backups;
}

/** Validate a filename to prevent path traversal. */
function safeName(filename: string): string {
  const clean = basename(filename);
  if (clean !== filename || !clean.startsWith('budget-backup-') || !clean.endsWith('.db')) {
    throw new Error('Invalid backup filename');
  }
  return clean;
}

/** Get the full path to a backup file (validated). */
export function getBackupPath(filename: string): string {
  const clean = safeName(filename);
  const fullPath = join(BACKUP_DIR, clean);
  if (!existsSync(fullPath)) {
    throw new Error('Backup not found');
  }
  return fullPath;
}

function removeIfExists(path: string): void {
  try {
    unlinkSync(path);
  } catch {
    // Ignore absent sidecar files.
  }
}

function removeSqliteSidecars(dbPath: string): void {
  removeIfExists(`${dbPath}-wal`);
  removeIfExists(`${dbPath}-shm`);
}

function validateSqliteDatabase(dbPath: string): void {
  const testDb = new Database(dbPath, { readonly: true });
  try {
    testDb.exec('SELECT count(*) FROM sqlite_master');
    const checks = testDb
      .query<{ integrity_check: string }, []>('PRAGMA integrity_check')
      .all();
    const failures = checks
      .map((row) => row.integrity_check)
      .filter((result) => result !== 'ok');
    if (failures.length > 0) {
      throw new Error(`SQLite integrity check failed: ${failures.join('; ')}`);
    }
  } finally {
    testDb.close();
  }
}

async function replaceDatabaseFile(sourcePath: string): Promise<void> {
  const dbPath = resolve(config.database.path);
  const rollbackPath = join(BACKUP_DIR, `_restore-rollback-${Date.now()}.db`);

  validateSqliteDatabase(sourcePath);

  sqlite.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  copyFileSync(dbPath, rollbackPath);

  try {
    // Drizzle's prepared-statement wrappers are unreachable after each
    // query but not yet finalized; a synchronous GC finalizes them so
    // close() actually releases the file handle.
    Bun.gc(true);
    sqlite.close(true);
    removeSqliteSidecars(dbPath);
    copyFileSync(sourcePath, dbPath);
    removeSqliteSidecars(dbPath);
    resetConnection();
  } catch (error) {
    // The exported sqlite/db are tied to a now-closed connection. Whether
    // or not the rollback copy succeeds, we must reopen so subsequent
    // requests don't hit "Cannot use a closed database".
    try {
      removeSqliteSidecars(dbPath);
      copyFileSync(rollbackPath, dbPath);
      removeSqliteSidecars(dbPath);
    } catch {
      // Rollback copy failed; still try to reopen below.
    }
    try {
      resetConnection();
    } catch {
      // Connection cannot be re-established. The original error is thrown
      // below; the next request will surface this terminal state.
    }
    throw error;
  } finally {
    removeIfExists(rollbackPath);
  }

  validateSqliteDatabase(dbPath);
}

/** Delete a backup file. */
export function deleteBackup(filename: string): void {
  const fullPath = getBackupPath(filename);
  unlinkSync(fullPath);
}

/**
 * Restore from a backup file — replaces the main database.
 *
 * 1. Close the current database connection
 * 2. Copy the backup over the main database file
 * 3. Re-open the database connection
 */
export async function restoreBackup(filename: string): Promise<void> {
  const backupPath = getBackupPath(filename);
  await replaceDatabaseFile(backupPath);
}

/**
 * Restore from an uploaded .db file.
 *
 * 1. Write uploaded bytes to a temp file
 * 2. Validate it's a valid SQLite database
 * 3. Close the current connection, overwrite the main DB, re-open
 */
export async function restoreFromUpload(data: ArrayBuffer): Promise<void> {
  ensureBackupDir();

  const tempPath = join(BACKUP_DIR, `_upload-restore-${Date.now()}.db`);

  try {
    // Write the uploaded data to a temp file
    writeFileSync(tempPath, Buffer.from(data));

    // Valid DB — swap it in
    await replaceDatabaseFile(tempPath);
  } finally {
    // Clean up temp file
    try { unlinkSync(tempPath); } catch { /* ignore */ }
  }
}

/** Returns the absolute path to the backups directory. */
export function getBackupDir(): string {
  ensureBackupDir();
  return BACKUP_DIR;
}
