import { createOpenAI } from '@ai-sdk/openai';
import { HttpError } from '../../shared/http-error.mjs';
import { readSetting } from '../setting/setting-store.mjs';

const DEFAULT_API_KEY_ENV = 'AI_API_KEY';

/** Creates the model chosen in Settings; fails with 503 when the model or its API key is missing. */
export async function createLanguageModel() {
  const { model, baseUrl, apiKeyEnv } = (await readSetting()).ai ?? {};
  if (!model) throw new HttpError(503, 'AI is not configured: choose a model in Settings');
  const keyEnv = apiKeyEnv || DEFAULT_API_KEY_ENV;
  // NOTE: Only the variable name is saved in Settings, so the key never lands in setting.json.
  const apiKey = process.env[keyEnv];
  if (!apiKey) throw new HttpError(503, `AI is not configured: set the ${keyEnv} environment variable`);
  // Chat Completions rather than the Responses API keeps OpenAI-compatible endpoints working.
  return createOpenAI({ apiKey, baseURL: baseUrl || undefined }).chat(model);
}
