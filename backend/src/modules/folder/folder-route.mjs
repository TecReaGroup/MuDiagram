import { log } from '../../infrastructure/logger.mjs';
import { HttpError } from '../../shared/http-error.mjs';
import { readJsonBody, sendJson, sendNoContent } from '../../shared/http.mjs';
import { createFolder, deleteFolder, listFolders, renameFolder } from './folder-store.mjs';

const MAX_FOLDER_NAME_LENGTH = 60;
const FOLDER_PATH = '/api/folder/(?<folderId>[0-9a-f-]{36})';

function readFolderName(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > MAX_FOLDER_NAME_LENGTH) {
    throw new HttpError(400, `Folder name must be 1-${MAX_FOLDER_NAME_LENGTH} characters`);
  }
  return name;
}

export const folderRoutes = [
  {
    method: 'GET',
    path: new RegExp('^/api/folder$'),
    handle: async (request, response) => sendJson(response, 200, await listFolders()),
  },
  {
    method: 'POST',
    path: new RegExp('^/api/folder$'),
    handle: async (request, response) => {
      const folder = await createFolder(readFolderName(await readJsonBody(request)));
      log('info', 'Folder', 'Folder created', { folderId: folder.id });
      sendJson(response, 201, folder);
    },
  },
  {
    method: 'PATCH',
    path: new RegExp(`^${FOLDER_PATH}$`),
    handle: async (request, response, { folderId }) => {
      sendJson(response, 200, await renameFolder(folderId, readFolderName(await readJsonBody(request))));
    },
  },
  {
    method: 'DELETE',
    path: new RegExp(`^${FOLDER_PATH}$`),
    handle: async (request, response, { folderId }) => {
      await deleteFolder(folderId);
      log('info', 'Folder', 'Folder deleted', { folderId });
      sendNoContent(response);
    },
  },
];
