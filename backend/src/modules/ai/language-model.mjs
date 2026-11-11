import { createOpenAI } from '@ai-sdk/openai';
import { HttpError } from '../../shared/http-error.mjs';
import { readSetting } from '../setting/setting-store.mjs';

/** Builds a chat model from an AI setting; fails with 503 when the model or its API key is missing. */
export function buildLanguageModel({ model, baseUrl, apiKey }) {
  if (!model) throw new HttpError(503, 'AI is not configured: choose a model in Settings');
  if (!apiKey) throw new HttpError(503, 'AI is not configured: enter an API key in Settings');
  // Chat Completions rather than the Responses API keeps OpenAI-compatible endpoints working.
  return createOpenAI({ apiKey, baseURL: baseUrl || undefined }).chat(model);
}

/** Creates the model saved in Settings. */
export async function createLanguageModel() {
  return buildLanguageModel((await readSetting()).ai ?? {});
}
