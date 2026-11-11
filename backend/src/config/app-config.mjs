import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const CONFIG_FILE = resolve(REPOSITORY_ROOT, 'config/config.toml');
export const UI_LANGUAGES = ['zh-CN', 'en-US'];

function readSection(config, name) {
  const section = config[name];
  if (!section || typeof section !== 'object') throw new Error(`config.toml: missing [${name}] section`);
  return section;
}

function loadAppConfig() {
  const config = parse(readFileSync(CONFIG_FILE, 'utf8'));
  const storage = readSection(config, 'storage');
  const trash = readSection(config, 'trash');
  const ui = readSection(config, 'ui');
  const ai = readSection(config, 'ai');

  if (!UI_LANGUAGES.includes(ui.language)) {
    throw new Error(`config.toml: ui.language must be one of ${UI_LANGUAGES.join(', ')}`);
  }

  const retentionDays = Number(trash.retention_days);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    throw new Error('config.toml: trash.retention_days must be a positive number');
  }

  return {
    storage: {
      projectRoot: resolve(REPOSITORY_ROOT, String(storage.project_root)),
      folderFile: resolve(REPOSITORY_ROOT, String(storage.folder_file)),
      settingFile: resolve(REPOSITORY_ROOT, String(storage.setting_file)),
    },
    trash: {
      retentionDays,
    },
    ui: {
      language: ui.language,
    },
    ai: {
      model: String(ai.model),
      baseUrl: ai.base_url ? String(ai.base_url) : undefined,
      apiKeyEnv: String(ai.api_key_env),
    },
  };
}

export const appConfig = loadAppConfig();
