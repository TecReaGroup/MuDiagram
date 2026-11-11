import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { appConfig } from '../../config/app-config.mjs';
import { HttpError } from '../../shared/http-error.mjs';

const MODEL_FACTORIES = {
  anthropic: ({ apiKey, baseURL, model }) => createAnthropic({ apiKey, baseURL })(model),
  // Chat Completions rather than the Responses API keeps OpenAI-compatible endpoints working.
  openai: ({ apiKey, baseURL, model }) => createOpenAI({ apiKey, baseURL }).chat(model),
};

/** Creates the model chosen in config.toml; fails with 503 when its API key is missing. */
export function createLanguageModel() {
  const { provider, model, baseUrl, apiKeyEnv } = appConfig.ai;
  const apiKey = process.env[apiKeyEnv];
  if (!apiKey) throw new HttpError(503, `AI is not configured: set the ${apiKeyEnv} environment variable`);
  return MODEL_FACTORIES[provider]({ apiKey, baseURL: baseUrl, model });
}
