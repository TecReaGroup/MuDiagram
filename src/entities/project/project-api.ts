import { ApiError, requestJson } from '../../shared/api/request-json';

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

export const getProject = (projectId: string) => requestJson<Project>(`${PROJECT_API}/${projectId}`);

export const createProject = (name: string, folderId: string | null) =>
  requestJson<Project>(PROJECT_API, { method: 'POST', body: JSON.stringify({ name, folderId }) });

export const renameProject = (projectId: string, name: string) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}`, { method: 'PATCH', body: JSON.stringify({ name }) });

export const moveProjectToFolder = (projectId: string, folderId: string | null) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}/folder`, { method: 'PUT', body: JSON.stringify({ folderId }) });

/** An already shared project keeps its existing link. */
export const shareProject = (projectId: string) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}/share`, { method: 'POST' });

export const unshareProject = (projectId: string) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}/share`, { method: 'DELETE' });

export const moveProjectToTrash =(projectId: string) =>
  requestJson<TrashedProject>(`${PROJECT_API}/${projectId}`, { method: 'DELETE' });

export const listTrashedProjects = () => requestJson<TrashedProject[]>(TRASH_API);

export const restoreProject = (projectId: string) =>
  requestJson<Project>(`${TRASH_API}/${projectId}/restore`, { method: 'POST' });

export const deleteProjectPermanently = (projectId: string) =>
  requestJson<void>(`${TRASH_API}/${projectId}`, { method: 'DELETE' });

export async function getDiagramXml(projectId: string): Promise<string> {
  const response = await fetch(`${PROJECT_API}/${projectId}/diagram.drawio`, { cache: 'no-store' });
  if (!response.ok) throw new ApiError(response.status, `Diagram request failed with ${response.status}`);
  return response.text();
}

/**
 * Args:
 *   snapshot: `svg` and `png` are data URLs exported from the same editor state as `xml`.
 */
export const saveDiagram = (projectId: string, snapshot: { xml: string; svg: string; png: string }) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}/diagram`, { method: 'PUT', body: JSON.stringify(snapshot) });

/** `updatedAt` doubles as a cache buster so a re-saved diagram shows its new preview. */
export function projectPreviewUrl(project: Project): string {
  return `${PROJECT_API}/${project.id}/diagram.svg?v=${encodeURIComponent(project.updatedAt)}`;
}
