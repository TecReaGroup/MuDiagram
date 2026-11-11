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

/** Merges `changes` into the saved settings and returns the full result. */
export function updateSetting(changes) {
  const update = settingWriteQueue.catch(() => {}).then(async () => {
    const setting = { ...await readSetting(), ...changes };
    await mkdir(dirname(settingFile), { recursive: true });
    const temporaryPath = `${settingFile}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(setting, null, 2));
    await rename(temporaryPath, settingFile);
    return setting;
  });
  settingWriteQueue = update;
  return update;
}
