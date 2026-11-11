import { HttpError } from '../../shared/http-error.mjs';

const AI_SETTING_FIELDS = ['model', 'baseUrl', 'apiKey'];

/** Reads the AI fields present in a request body; absent fields are left out so the saved values stay. */
export function readAiSetting(ai) {
  if (!ai || typeof ai !== 'object') throw new HttpError(400, 'ai must be an object');
  const aiSetting = {};
  for (const field of AI_SETTING_FIELDS) {
    if (ai[field] === undefined) continue;
    if (typeof ai[field] !== 'string') throw new HttpError(400, `ai.${field} must be a string`);
    aiSetting[field] = ai[field].trim();
  }
  return aiSetting;
}

/** Only the known AI fields, so stale keys left in setting.json never reach the browser. */
export function toPublicAiSetting(ai = {}) {
  return { model: ai.model ?? '', baseUrl: ai.baseUrl ?? '', apiKey: ai.apiKey ?? '' };
}
