import { requestJson } from '../../shared/api/request-json';

export type Project = {
  id: string;
  name: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  shareToken: string | null;
  trashedAt: string | null;
};

export type TrashedProject = Project & {
  trashedAt: string;
  /** When the server deletes the project for good. */
  purgeAt: string;
};

const PROJECT_API = '/api/project';
const TRASH_API = '/api/trash';

export const listProjects = () => requestJson<Project[]>(PROJECT_API);

export const createProject = (name: string, folderId: string | null) =>
  requestJson<Project>(PROJECT_API, { method: 'POST', body: JSON.stringify({ name, folderId }) });

export const renameProject = (projectId: string, name: string) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}`, { method: 'PATCH', body: JSON.stringify({ name }) });

export const moveProjectToFolder = (projectId: string, folderId: string | null) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}/folder`, { method: 'PUT', body: JSON.stringify({ folderId }) });

export const moveProjectToTrash = (projectId: string) =>
  requestJson<TrashedProject>(`${PROJECT_API}/${projectId}`, { method: 'DELETE' });

export const listTrashedProjects = () => requestJson<TrashedProject[]>(TRASH_API);

export const restoreProject = (projectId: string) =>
  requestJson<Project>(`${TRASH_API}/${projectId}/restore`, { method: 'POST' });

export const deleteProjectPermanently = (projectId: string) =>
  requestJson<void>(`${TRASH_API}/${projectId}`, { method: 'DELETE' });

/** `updatedAt` doubles as a cache buster so a re-saved diagram shows its new preview. */
export function projectPreviewUrl(project: Project): string {
  return `${PROJECT_API}/${project.id}/diagram.svg?v=${encodeURIComponent(project.updatedAt)}`;
}
