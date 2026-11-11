import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { appConfig } from '../../config/app-config.mjs';

const settingFile = appConfig.storage.settingFile;
const DEFAULT_SETTING = { language: appConfig.ui.language };
let settingWriteQueue = Promise.resolve();

/** Saved settings layered over the config.toml defaults. */
export async function readSetting() {
  try {
    return { ...DEFAULT_SETTING, ...JSON.parse(await readFile(settingFile, 'utf8')) };
  } catch (error) {
    if (error?.code === 'ENOENT') return DEFAULT_SETTING;
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
