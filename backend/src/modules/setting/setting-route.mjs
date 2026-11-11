import { log } from '../../infrastructure/logger.mjs';
import { HttpError } from '../../shared/http-error.mjs';
import { readJsonBody, sendJson } from '../../shared/http.mjs';
import { readAiSetting, toPublicAiSetting } from './ai-setting.mjs';
import { readSetting, updateSetting } from './setting-store.mjs';

const UI_LANGUAGES = ['zh-CN', 'en-US'];

function toPublicSetting(setting) {
  return { ...setting, ai: toPublicAiSetting(setting.ai) };
}

function readSettingChanges(body) {
  const changes = {};
  if (body?.language !== undefined) {
    if (!UI_LANGUAGES.includes(body.language)) {
      throw new HttpError(400, `language must be one of ${UI_LANGUAGES.join(', ')}`);
    }
    changes.language = body.language;
  }
  if (body?.ai !== undefined) changes.ai = readAiSetting(body.ai);
  if (Object.keys(changes).length === 0) throw new HttpError(400, 'Nothing to update: send language or ai');
  return changes;
}

export const settingRoutes = [
  {
    method: 'GET',
    path: new RegExp('^/api/setting$'),
    handle: async (request, response) => sendJson(response, 200, toPublicSetting(await readSetting())),
  },
  {
    method: 'PATCH',
    path: new RegExp('^/api/setting$'),
    handle: async (request, response) => {
      const changes = readSettingChanges(await readJsonBody(request));
      const setting = await updateSetting(changes);
      log('info', 'Setting', 'Setting updated', { fields: Object.keys(changes), aiFields: Object.keys(changes.ai ?? {}) });
      sendJson(response, 200, toPublicSetting(setting));
    },
  },
];
