import { requestJson } from '../../shared/api/request-json';

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  shareToken: string | null;
};

export type SharedProject = Pick<Project, 'name' | 'updatedAt'>;

export type DiagramSnapshot = {
  xml: string;
  svgDataUrl: string;
  pngDataUrl: string;
};

export type DiagramFileExtension = 'drawio' | 'svg' | 'png';

const PROJECT_API = '/api/project';
const SHARE_API = '/api/share';

export const listProjects = () => requestJson<Project[]>(PROJECT_API);

export const getProject = (projectId: string) => requestJson<Project>(`${PROJECT_API}/${projectId}`);

export const createProject = (name: string) =>
  requestJson<Project>(PROJECT_API, { method: 'POST', body: JSON.stringify({ name }) });

export const renameProject = (projectId: string, name: string) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}`, { method: 'PATCH', body: JSON.stringify({ name }) });

export const deleteProject = (projectId: string) =>
  requestJson<void>(`${PROJECT_API}/${projectId}`, { method: 'DELETE' });

export async function readDiagramXml(projectId: string): Promise<string> {
  const response = await fetch(projectDiagramUrl(projectId, 'drawio'));
  if (!response.ok) throw new Error(`Failed to load diagram (${response.status})`);
  return response.text();
}

export const saveDiagram = (projectId: string, snapshot: DiagramSnapshot) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}/diagram`, {
    method: 'PUT',
    body: JSON.stringify({ xml: snapshot.xml, svg: snapshot.svgDataUrl, png: snapshot.pngDataUrl }),
  });

export const enableShare = (projectId: string) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}/share`, { method: 'POST' });

export const disableShare = (projectId: string) =>
  requestJson<Project>(`${PROJECT_API}/${projectId}/share`, { method: 'DELETE' });

export const getSharedProject = (shareToken: string) => requestJson<SharedProject>(`${SHARE_API}/${shareToken}`);

/** `version` busts the browser cache after the diagram is saved again. */
export function projectDiagramUrl(projectId: string, extension: DiagramFileExtension, version?: string): string {
  const url = `${PROJECT_API}/${projectId}/diagram.${extension}`;
  return version ? `${url}?v=${encodeURIComponent(version)}` : url;
}

export function sharedDiagramUrl(shareToken: string, extension: DiagramFileExtension): string {
  return `${window.location.origin}${SHARE_API}/${shareToken}/diagram.${extension}`;
}

export function sharePageUrl(shareToken: string): string {
  return `${window.location.origin}/share/${shareToken}`;
}
