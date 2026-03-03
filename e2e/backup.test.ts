import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getApp, startServer, stopServer } from './setup';
import {
  apiHeaders,
  seedMonth,
  seedPeriod,
  seedCategory,
  seedExpense,
  seedIncomeType,
  seedIncome,
  registerUser,
  loginUser,
} from './helpers';
import type { Hono } from 'hono';
import { Database } from 'bun:sqlite';

let app: Hono;
let adminToken: string;

/** Register a user, set them as admin via direct DB, and return a JWT token. */
async function getAdminToken(app: Hono): Promise<string> {
  const email = 'backup-admin@test.com';
  const password = 'adminpass123';
  await registerUser(app, email, password, 'Backup Admin');

  // Set the user as admin directly in the test DB
  const dbPath = process.env.DATABASE_PATH!;
  const sqlite = new Database(dbPath);
  sqlite.exec(`UPDATE users SET is_admin = 1 WHERE email = '${email}'`);
  sqlite.close();

  const loginRes = await loginUser(app, email, password);
  const data = (await loginRes.json()) as { access_token: string };
  return data.access_token;
}

beforeAll(async () => {
  app = await getApp();
  adminToken = await getAdminToken(app);

  const period = await seedPeriod(app, 'Bak-Period');
  const cat = await seedCategory(app, 'Bak-Category');
  const it = await seedIncomeType(app, 'Bak-Salary');
  const month = await seedMonth(app, 2023, 1);
  await seedExpense(app, month.id, {
    expense_name: 'BakExp',
    period: period.name,
    category: cat.name,
    budget: 100,
  });
  await seedIncome(app, month.id, { income_type_id: it.id, period: period.name, budget: 500 });
});

// ─── JSON backup (legacy /api/v1/backup) ────────────────────────────────────

describe('JSON Backup (Hono client)', () => {
  test('GET /api/v1/backup returns all data', async () => {
    const res = await app.request('/api/v1/backup', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      categories: unknown[];
      periods: unknown[];
      income_types: unknown[];
      months: unknown[];
      expenses: unknown[];
      incomes: unknown[];
    };
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.periods.length).toBeGreaterThan(0);
    expect(data.months.length).toBeGreaterThan(0);
    expect(data.expenses.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/backup/download returns JSON file', async () => {
    const res = await app.request('/api/v1/backup/download', { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const contentDisposition = res.headers.get('Content-Disposition');
    expect(contentDisposition).toContain('attachment');
    expect(contentDisposition).toContain('budget-backup-');
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  test('backup without API key returns 403', async () => {
    const res = await app.request('/api/v1/backup');
    expect(res.status).toBe(403);
  });
});

// ─── SQLite file backups (/api/v1/backups) ──────────────────────────────────

describe('SQLite Backups (Hono client)', () => {
  let createdFilename: string;

  test('POST /api/v1/backups/create creates a backup', async () => {
    const res = await app.request('/api/v1/backups/create', {
      method: 'POST',
      headers: apiHeaders(adminToken),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      message: string;
      filename: string;
      size: number;
      created_at: string;
    };
    expect(data.message).toContain('Backup created');
    expect(data.filename).toMatch(/^budget-backup-.*\.db$/);
    expect(data.size).toBeGreaterThan(0);
    createdFilename = data.filename;
  });

  test('GET /api/v1/backups lists backups', async () => {
    const res = await app.request('/api/v1/backups', {
      headers: apiHeaders(adminToken),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      backups: Array<{ filename: string; size: number; created_at: string }>;
      backup_dir: string;
    };
    expect(data.backups.length).toBeGreaterThan(0);
    expect(data.backups.some((b) => b.filename === createdFilename)).toBe(true);
    expect(data.backup_dir).toBeTruthy();
  });

  test('GET /api/v1/backups/:filename/download returns file', async () => {
    const res = await app.request(`/api/v1/backups/${createdFilename}/download`, {
      headers: apiHeaders(adminToken),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
    expect(res.headers.get('Content-Disposition')).toContain(createdFilename);
    const bytes = await res.arrayBuffer();
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  test('POST /api/v1/backups/:filename/restore restores database', async () => {
    const res = await app.request(`/api/v1/backups/${createdFilename}/restore`, {
      method: 'POST',
      headers: apiHeaders(adminToken),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { message: string };
    expect(data.message).toContain('restored');
  });

  test('POST /api/v1/backups/upload-restore restores from uploaded file', async () => {
    // Download the backup we created earlier
    const dlRes = await app.request(`/api/v1/backups/${createdFilename}/download`, {
      headers: apiHeaders(adminToken),
    });
    expect(dlRes.status).toBe(200);
    const bytes = await dlRes.arrayBuffer();

    // Upload it back as a restore
    const formData = new FormData();
    formData.append('file', new File([bytes], 'uploaded-backup.db'));

    const headers = apiHeaders(adminToken);
    // Remove Content-Type so FormData sets its own boundary
    delete headers['Content-Type'];

    const res = await app.request('/api/v1/backups/upload-restore', {
      method: 'POST',
      headers,
      body: formData,
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { message: string };
    expect(data.message).toContain('restored');
  });

  test('POST /api/v1/backups/upload-restore rejects non-.db files', async () => {
    const formData = new FormData();
    formData.append('file', new File(['not a db'], 'backup.txt'));

    const headers = apiHeaders(adminToken);
    delete headers['Content-Type'];

    const res = await app.request('/api/v1/backups/upload-restore', {
      method: 'POST',
      headers,
      body: formData,
    });
    expect(res.status).toBe(400);
  });

  test('DELETE /api/v1/backups/:filename deletes backup', async () => {
    // Create a fresh backup to delete (the previous one might still be needed)
    const createRes = await app.request('/api/v1/backups/create', {
      method: 'POST',
      headers: apiHeaders(adminToken),
    });
    const { filename } = (await createRes.json()) as { filename: string };

    const res = await app.request(`/api/v1/backups/${filename}`, {
      method: 'DELETE',
      headers: apiHeaders(adminToken),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { message: string };
    expect(data.message).toContain('deleted');

    // Verify it's gone from the list
    const listRes = await app.request('/api/v1/backups', {
      headers: apiHeaders(adminToken),
    });
    const listData = (await listRes.json()) as {
      backups: Array<{ filename: string }>;
    };
    expect(listData.backups.some((b) => b.filename === filename)).toBe(false);
  });

  test('backups without auth returns 401/403', async () => {
    const res = await app.request('/api/v1/backups');
    expect(res.status).toBe(403);

    const res2 = await app.request('/api/v1/backups', {
      headers: apiHeaders(), // API key but no JWT
    });
    expect(res2.status).toBe(401);
  });

  test('invalid filename returns error', async () => {
    const res = await app.request('/api/v1/backups/../etc/passwd/download', {
      headers: apiHeaders(adminToken),
    });
    // Should get an error (either 400 or 404)
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ─── HTTP server tests ──────────────────────────────────────────────────────

describe('Backup (HTTP)', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test('GET backup via HTTP', async () => {
    const res = await fetch(`${baseUrl}/api/v1/backup`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { categories: unknown[] };
    expect(Array.isArray(data.categories)).toBe(true);
  });

  test('GET backup download via HTTP', async () => {
    const res = await fetch(`${baseUrl}/api/v1/backup/download`, { headers: apiHeaders() });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
  });
});
