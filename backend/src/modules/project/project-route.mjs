import { log } from '../../infrastructure/logger.mjs';
import { HttpError } from '../../shared/http-error.mjs';
import { readJsonBody, sendFile, sendJson } from '../../shared/http.mjs';
import { assertFolderExists } from '../folder/folder-store.mjs';
import {
  createProject,
  disableShare,
  enableShare,
  getProject,
  listProjects,
  moveProjectToFolder,
  moveProjectToTrash,
  readDiagramRendition,
  renameProject,
  saveDiagram,
} from './project-store.mjs';

const MAX_PROJECT_NAME_LENGTH = 120;
const PROJECT_PATH = '/api/project/(?<projectId>[0-9a-f-]{36})';
// Matches `data:<mime>;base64,<payload>` and `data:<mime>,<url-encoded payload>`.
const DATA_URL_PATTERN = /^data:(?<mime>[^;,]+)(?<base64>;base64)?,(?<payload>.*)$/s;

function readProjectName(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > MAX_PROJECT_NAME_LENGTH) {
    throw new HttpError(400, `Project name must be 1-${MAX_PROJECT_NAME_LENGTH} characters`);
  }
  return name;
}

/** A missing `folderId` means "no folder"; any other value must name an existing folder. */
async function readFolderId(body) {
  const folderId = body?.folderId ?? null;
  if (folderId === null) return null;
  if (typeof folderId !== 'string') throw new HttpError(400, 'folderId must be a string or null');
  await assertFolderExists(folderId);
  return folderId;
}

function decodeDataUrl(dataUrl, expectedMime) {
  const match = typeof dataUrl === 'string' ? DATA_URL_PATTERN.exec(dataUrl) : null;
  if (match?.groups.mime !== expectedMime) throw new HttpError(400, `Expected a ${expectedMime} data URL`);
  const { base64, payload } = match.groups;
  return base64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8');
}

function readDiagramSnapshot(body) {
  if (typeof body?.xml !== 'string' || !body.xml.includes('<mxfile')) {
    throw new HttpError(400, 'xml must be a draw.io <mxfile> document');
  }
  return {
    xml: body.xml,
    svg: decodeDataUrl(body.svg, 'image/svg+xml'),
    png: decodeDataUrl(body.png, 'image/png'),
  };
}

export const projectRoutes = [
  {
    method: 'GET',
    path: new RegExp('^/api/project$'),
    handle: async (request, response) => sendJson(response, 200, await listProjects()),
  },
  {
    method: 'POST',
    path: new RegExp('^/api/project$'),
    handle: async (request, response) => {
      const body = await readJsonBody(request);
      const project = await createProject(readProjectName(body), await readFolderId(body));
      log('info', 'Project', 'Project created', { projectId: project.id });
      sendJson(response, 201, project);
    },
  },
  {
    method: 'GET',
    path: new RegExp(`^${PROJECT_PATH}$`),
    handle: async (request, response, { projectId }) => sendJson(response, 200, await getProject(projectId)),
  },
  {
    method: 'PATCH',
    path: new RegExp(`^${PROJECT_PATH}$`),
    handle: async (request, response, { projectId }) => {
      sendJson(response, 200, await renameProject(projectId, readProjectName(await readJsonBody(request))));
    },
  },
  {
    method: 'DELETE',
    path: new RegExp(`^${PROJECT_PATH}$`),
    handle: async (request, response, { projectId }) => {
      const project = await moveProjectToTrash(projectId);
      log('info', 'Project', 'Project moved to trash', { projectId });
      sendJson(response, 200, project);
    },
  },
  {
    method: 'PUT',
    path: new RegExp(`^${PROJECT_PATH}/folder$`),
    handle: async (request, response, { projectId }) => {
      const folderId = await readFolderId(await readJsonBody(request));
      sendJson(response, 200, await moveProjectToFolder(projectId, folderId));
    },
  },
  {
    method: 'PUT',
    path: new RegExp(`^${PROJECT_PATH}/diagram$`),
    handle: async (request, response, { projectId }) => {
      const snapshot = readDiagramSnapshot(await readJsonBody(request));
      const project = await saveDiagram(projectId, snapshot);
      log('debug', 'Project', 'Diagram saved', { projectId, size: snapshot.xml.length + snapshot.svg.length + snapshot.png.length });
      sendJson(response, 200, project);
    },
  },
  {
    method: 'GET',
    path: new RegExp(`^${PROJECT_PATH}/diagram\\.(?<extension>drawio|svg|png)$`),
    handle: async (request, response, { projectId, extension }) => {
      const { contentType, content } = await readDiagramRendition(projectId, extension);
      sendFile(response, contentType, content);
    },
  },
  {
    method: 'POST',
    path: new RegExp(`^${PROJECT_PATH}/share$`),
    handle: async (request, response, { projectId }) => {
      const project = await enableShare(projectId);
      log('info', 'Project', 'Project shared', { projectId });
      sendJson(response, 200, project);
    },
  },
  {
    method: 'DELETE',
    path: new RegExp(`^${PROJECT_PATH}/share$`),
    handle: async (request, response, { projectId }) => {
      const project = await disableShare(projectId);
      log('info', 'Project', 'Project unshared', { projectId });
      sendJson(response, 200, project);
    },
  },
];
