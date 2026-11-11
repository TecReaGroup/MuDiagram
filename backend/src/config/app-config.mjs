import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const CONFIG_FILE = resolve(REPOSITORY_ROOT, 'config/config.toml');

function readSection(config, name) {
  const section = config[name];
  if (!section || typeof section !== 'object') throw new Error(`config.toml: missing [${name}] section`);
  return section;
}

function loadAppConfig() {
  const config = parse(readFileSync(CONFIG_FILE, 'utf8'));
  const server = readSection(config, 'server');
  const storage = readSection(config, 'storage');
  const trash = readSection(config, 'trash');

  const retentionDays = Number(trash.retention_days);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    throw new Error('config.toml: trash.retention_days must be a positive number');
  }

  const port = Number(server.port);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('config.toml: server.port must be an integer between 1 and 65535');
  }

  return {
    server: {
      port,
    },
    storage: {
      projectRoot: resolve(REPOSITORY_ROOT, String(storage.project_root)),
      folderFile: resolve(REPOSITORY_ROOT, String(storage.folder_file)),
      settingFile: resolve(REPOSITORY_ROOT, String(storage.setting_file)),
    },
    trash: {
      retentionDays,
    },
  };
}

export const appConfig = loadAppConfig();
