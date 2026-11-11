import { createOpenAI } from '@ai-sdk/openai';
import { appConfig } from '../../config/app-config.mjs';
import { HttpError } from '../../shared/http-error.mjs';

/** Creates the model chosen in config.toml; fails with 503 when its API key is missing. */
export function createLanguageModel() {
  const { model, baseUrl, apiKeyEnv } = appConfig.ai;
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) throw new HttpError(503, `AI is not configured: set the ${apiKeyEnv} environment variable`);
  // Chat Completions rather than the Responses API keeps OpenAI-compatible endpoints working.
  return createOpenAI({ apiKey, baseURL: baseUrl }).chat(model);
}
