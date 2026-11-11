import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { appConfig } from '../../config/app-config.mjs';

const settingFile = appConfig.storage.settingFile;
let settingWriteQueue = Promise.resolve();

/** Settings changed from the Settings dialog; unset keys fall back to client-side defaults. */
export async function readSetting() {
  try {
    return JSON.parse(await readFile(settingFile, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    throw error;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Merges `changes` into the saved settings two levels deep (so `ai.apiKey` survives an `ai.model` change). */
export function updateSetting(changes) {
  const update = settingWriteQueue.catch(() => {}).then(async () => {
    const setting = await readSetting();
    for (const [key, value] of Object.entries(changes)) {
      setting[key] = isPlainObject(setting[key]) && isPlainObject(value) ? { ...setting[key], ...value } : value;
    }
    await mkdir(dirname(settingFile), { recursive: true });
    const temporaryPath = `${settingFile}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(setting, null, 2));
    await rename(temporaryPath, settingFile);
    return setting;
  });
  settingWriteQueue = update;
  return update;
}
