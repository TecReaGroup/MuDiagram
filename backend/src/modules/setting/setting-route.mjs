import { UI_LANGUAGES } from '../../config/app-config.mjs';
import { log } from '../../infrastructure/logger.mjs';
import { HttpError } from '../../shared/http-error.mjs';
import { readJsonBody, sendJson } from '../../shared/http.mjs';
import { readSetting, updateSetting } from './setting-store.mjs';

function readSettingChanges(body) {
  if (!UI_LANGUAGES.includes(body?.language)) {
    throw new HttpError(400, `language must be one of ${UI_LANGUAGES.join(', ')}`);
  }
  return { language: body.language };
}

export const settingRoutes = [
  {
    method: 'GET',
    path: new RegExp('^/api/setting$'),
    handle: async (request, response) => sendJson(response, 200, await readSetting()),
  },
  {
    method: 'PATCH',
    path: new RegExp('^/api/setting$'),
    handle: async (request, response) => {
      const changes = readSettingChanges(await readJsonBody(request));
      const setting = await updateSetting(changes);
      log('info', 'Setting', 'Setting updated', changes);
      sendJson(response, 200, setting);
    },
  },
];
