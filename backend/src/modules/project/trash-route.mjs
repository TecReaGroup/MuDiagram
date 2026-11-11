import { log } from '../../infrastructure/logger.mjs';
import { sendJson, sendNoContent } from '../../shared/http.mjs';
import { deleteProjectPermanently, listTrashedProjects, restoreProject } from './project-store.mjs';

const TRASHED_PROJECT_PATH = '/api/trash/(?<projectId>[0-9a-f-]{36})';

export const trashRoutes = [
  {
    method: 'GET',
    path: new RegExp('^/api/trash$'),
    handle: async (request, response) => sendJson(response, 200, await listTrashedProjects()),
  },
  {
    method: 'POST',
    path: new RegExp(`^${TRASHED_PROJECT_PATH}/restore$`),
    handle: async (request, response, { projectId }) => {
      const project = await restoreProject(projectId);
      log('info', 'Trash', 'Project restored', { projectId });
      sendJson(response, 200, project);
    },
  },
  {
    method: 'DELETE',
    path: new RegExp(`^${TRASHED_PROJECT_PATH}$`),
    handle: async (request, response, { projectId }) => {
      await deleteProjectPermanently(projectId);
      log('info', 'Trash', 'Project deleted permanently', { projectId });
      sendNoContent(response);
    },
  },
];
