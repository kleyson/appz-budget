/**
 * Backups routes — SQLite file backup management.
 *
 * GET    /api/v1/backups                  — list backups
 * POST   /api/v1/backups/create           — create a new backup
 * GET    /api/v1/backups/:filename/download — download a backup file
 * DELETE /api/v1/backups/:filename        — delete a backup
 * POST   /api/v1/backups/:filename/restore — restore from a server-side backup
 * POST   /api/v1/backups/upload-restore   — restore from an uploaded .db file
 */

import { Hono } from 'hono';
import { apiKeyAuth } from '../middleware/api-key';
import { jwtAuth, adminAuth } from '../middleware/jwt';
import {
  listBackups,
  createBackup,
  getBackupPath,
  deleteBackup,
  restoreBackup,
  restoreFromUpload,
  getBackupDir,
} from '../services/backup';

const backupsRoute = new Hono();

// All backups endpoints require API key + JWT + admin
const auth = [apiKeyAuth, jwtAuth, adminAuth] as const;

// ─── GET /api/v1/backups ────────────────────────────────────────────────────

backupsRoute.get('/api/v1/backups', ...auth, (c) => {
  try {
    const backups = listBackups();
    return c.json({ backups, backup_dir: getBackupDir() });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return c.json({ detail }, 500);
  }
});

// ─── POST /api/v1/backups/create ────────────────────────────────────────────

backupsRoute.post('/api/v1/backups/create', ...auth, (c) => {
  try {
    const backup = createBackup();
    return c.json({
      message: 'Backup created successfully',
      filename: backup.filename,
      size: backup.size,
      created_at: backup.created_at,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return c.json({ detail: `Backup failed: ${detail}` }, 500);
  }
});

// ─── GET /api/v1/backups/:filename/download ─────────────────────────────────

backupsRoute.get('/api/v1/backups/:filename/download', ...auth, async (c) => {
  try {
    const filename = c.req.param('filename');
    const filePath = getBackupPath(filename);
    const file = Bun.file(filePath);
    const bytes = await file.arrayBuffer();

    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(file.size),
      },
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    const status = detail.includes('not found') ? 404 : 400;
    return c.json({ detail }, status);
  }
});

// ─── DELETE /api/v1/backups/:filename ───────────────────────────────────────

backupsRoute.delete('/api/v1/backups/:filename', ...auth, (c) => {
  try {
    const filename = c.req.param('filename');
    deleteBackup(filename);
    return c.json({ message: `Backup ${filename} deleted` });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    const status = detail.includes('not found') ? 404 : 400;
    return c.json({ detail }, status);
  }
});

// ─── POST /api/v1/backups/upload-restore ─────────────────────────────────────

backupsRoute.post('/api/v1/backups/upload-restore', ...auth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json({ detail: 'No file uploaded' }, 400);
    }
    if (!file.name.endsWith('.db')) {
      return c.json({ detail: 'File must be a .db SQLite database' }, 400);
    }

    const data = await file.arrayBuffer();
    restoreFromUpload(data);
    return c.json({ message: `Database restored from uploaded file: ${file.name}` });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return c.json({ detail: `Restore failed: ${detail}` }, 400);
  }
});

// ─── POST /api/v1/backups/:filename/restore ─────────────────────────────────

backupsRoute.post('/api/v1/backups/:filename/restore', ...auth, (c) => {
  try {
    const filename = c.req.param('filename');
    restoreBackup(filename);
    return c.json({ message: `Database restored from ${filename}` });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    const status = detail.includes('not found') ? 404 : 400;
    return c.json({ detail: `Restore failed: ${detail}` }, status);
  }
});

export default backupsRoute;
