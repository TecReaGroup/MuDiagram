import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'smol-toml';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const CONFIG_FILE = resolve(REPOSITORY_ROOT, 'config/config.toml');
const AI_PROVIDERS = ['anthropic', 'openai'];

function readSection(config, name) {
  const section = config[name];
  if (!section || typeof section !== 'object') throw new Error(`config.toml: missing [${name}] section`);
  return section;
}

function loadAppConfig() {
  const config = parse(readFileSync(CONFIG_FILE, 'utf8'));
  const storage = readSection(config, 'storage');
  const ai = readSection(config, 'ai');

  if (!AI_PROVIDERS.includes(ai.provider)) {
    throw new Error(`config.toml: ai.provider must be one of ${AI_PROVIDERS.join(', ')}`);
  }

  return {
    storage: {
      projectRoot: resolve(REPOSITORY_ROOT, String(storage.project_root)),
    },
    ai: {
      provider: ai.provider,
      model: String(ai.model),
      baseUrl: ai.base_url ? String(ai.base_url) : undefined,
      apiKeyEnv: String(ai.api_key_env),
      maxOutputTokens: Number(ai.max_output_tokens),
    },
  };
}

export const appConfig = loadAppConfig();
