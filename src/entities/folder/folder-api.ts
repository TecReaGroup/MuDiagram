import { requestJson } from '../../shared/api/request-json';

export type Folder = {
  id: string;
  name: string;
  createdAt: string;
};

const FOLDER_API = '/api/folder';

export const listFolders = () => requestJson<Folder[]>(FOLDER_API);

export const createFolder = (name: string) =>
  requestJson<Folder>(FOLDER_API, { method: 'POST', body: JSON.stringify({ name }) });

export const renameFolder = (folderId: string, name: string) =>
  requestJson<Folder>(`${FOLDER_API}/${folderId}`, { method: 'PATCH', body: JSON.stringify({ name }) });

/** Projects in the folder are kept; they just no longer belong to a folder. */
export const deleteFolder = (folderId: string) =>
  requestJson<void>(`${FOLDER_API}/${folderId}`, { method: 'DELETE' });
