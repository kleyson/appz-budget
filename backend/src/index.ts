import { app } from './app';
import { config } from './config';
import { createBackup } from './services/backup';

// ─── Cron: daily backup at 2:00 AM ─────────────────────────────────────────

const BACKUP_HOUR = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function msUntilNextBackup(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(BACKUP_HOUR, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

function runScheduledBackup(): void {
  try {
    const backup = createBackup();
    console.log(`[cron] Daily backup created: ${backup.filename} (${backup.size} bytes)`);
  } catch (e) {
    console.error('[cron] Daily backup failed:', e);
  }
}

// Schedule first run, then repeat every 24 hours
setTimeout(() => {
  runScheduledBackup();
  setInterval(runScheduledBackup, MS_PER_DAY);
}, msUntilNextBackup());

console.log(`[cron] Next daily backup in ${Math.round(msUntilNextBackup() / 60000)} minutes`);

// ─── Server ─────────────────────────────────────────────────────────────────

export default {
  port: config.port,
  fetch: app.fetch,
};
