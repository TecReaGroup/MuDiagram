import { log, serializeError } from '../../infrastructure/logger.mjs';
import { purgeExpiredTrash } from './project-store.mjs';

// Expired projects may linger up to one interval past their purge time; the trash UI still shows them as due.
const TRASH_PURGE_INTERVAL_MS = 60 * 60 * 1000;

async function purgeAndReport() {
  try {
    const purgedProjectIds = await purgeExpiredTrash();
    if (purgedProjectIds.length > 0) {
      log('info', 'Trash', 'Expired projects purged', { count: purgedProjectIds.length, projectIds: purgedProjectIds.join(',') });
    }
  } catch (error) {
    log('error', 'Trash', 'Trash purge failed', { error: serializeError(error) });
  }
}

/** Purges once at startup, then hourly; the timer never keeps the process alive on shutdown. */
export function startTrashPurgeSchedule() {
  void purgeAndReport();
  setInterval(purgeAndReport, TRASH_PURGE_INTERVAL_MS).unref();
}
