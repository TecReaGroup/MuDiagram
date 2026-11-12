import { createOpenAI } from '@ai-sdk/openai';
import { HttpError } from '../../shared/http-error.mjs';

/** Builds a chat model from an AI setting; fails with 503 when the model or its API key is missing. */
export function buildLanguageModel({ model, baseUrl, apiKey, nativeWebSearch }) {
  if (!model) throw new HttpError(503, 'AI is not configured: choose a model in Settings');
  if (!apiKey) throw new HttpError(503, 'AI is not configured: enter an API key in Settings');
  const provider = createOpenAI({ apiKey, baseURL: baseUrl || undefined });
  // Built-in search exists only on the Responses API; Chat Completions keeps OpenAI-compatible endpoints working.
  return nativeWebSearch ? provider.responses(model) : provider.chat(model);
}

