import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { appConfig } from '../../config/app-config.mjs';
import { HttpError } from '../../shared/http-error.mjs';
import { detachProjectsFromFolder } from '../project/project-store.mjs';

const folderFile = appConfig.storage.folderFile;
let folderWriteQueue = Promise.resolve();

async function readFolders() {
  try {
    return JSON.parse(await readFile(folderFile, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

// All folders share one file, so every read-modify-write runs strictly one after another.
function updateFolders(applyChange) {
  const update = folderWriteQueue.catch(() => {}).then(async () => {
    const { folders, changed } = applyChange(await readFolders());
    await mkdir(dirname(folderFile), { recursive: true });
    const temporaryPath = `${folderFile}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(folders, null, 2));
    await rename(temporaryPath, folderFile);
    return changed;
  });
  folderWriteQueue = update;
  return update;
}

function findFolderIndex(folders, folderId) {
  const index = folders.findIndex(folder => folder.id === folderId);
  if (index === -1) throw new HttpError(404, 'Folder not found');
  return index;
}

/** Folders in creation order. */
export function listFolders() {
  return readFolders();
}

/** Rejects with 404 when the folder does not exist. */
export async function assertFolderExists(folderId) {
  findFolderIndex(await readFolders(), folderId);
}

export function createFolder(name) {
  const folder = { id: randomUUID(), name, createdAt: new Date().toISOString() };
  return updateFolders(folders => ({ folders: [...folders, folder], changed: folder }));
}

export function renameFolder(folderId, name) {
  return updateFolders(folders => {
    const index = findFolderIndex(folders, folderId);
    const renamed = { ...folders[index], name };
    return { folders: folders.with(index, renamed), changed: renamed };
  });
}

/** Deletes the folder only; its projects stay in the library without a folder. */
export async function deleteFolder(folderId) {
  await updateFolders(folders => {
    const index = findFolderIndex(folders, folderId);
    return { folders: folders.toSpliced(index, 1), changed: folders[index] };
  });
  await detachProjectsFromFolder(folderId);
}
