import { useCallback, useEffect, useState } from 'react';
import * as folderApi from '../../entities/folder/folder-api';
import type { Folder } from '../../entities/folder/folder-api';
import * as projectApi from '../../entities/project/project-api';
import type { Project, TrashedProject } from '../../entities/project/project-api';
import { log, serializeError } from '../../shared/lib/logger';

const MODULE = 'ProjectLibrary';

export type ProjectSettings = {
  name: string;
  folderId: string | null;
  isShared: boolean;
};

function replaceById<T extends { id: string }>(items: T[], replacement: T): T[] {
  return items.map(item => (item.id === replacement.id ? replacement : item));
}

function withoutId<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter(item => item.id !== id);
}

/** Library state (projects, trash, folders) plus every operation that changes it. */
export function useProjectLibrary() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [trashedProjects, setTrashedProjects] = useState<TrashedProject[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [failure, setFailure] = useState<string | null>(null);

  const runReporting = useCallback(async <T,>(action: string, operation: () => Promise<T>): Promise<T | undefined> => {
    setFailure(null);
    try {
      return await operation();
    } catch (error) {
      log('error', MODULE, `${action} failed`, serializeError(error));
      setFailure(error instanceof Error ? error.message : String(error));
      return undefined;
    }
  }, []);

  useEffect(() => {
    void runReporting('Load library', async () => {
      const [loadedProjects, loadedTrash, loadedFolders] = await Promise.all([
        projectApi.listProjects(),
        projectApi.listTrashedProjects(),
        folderApi.listFolders(),
      ]);
      setProjects(loadedProjects);
      setTrashedProjects(loadedTrash);
      setFolders(loadedFolders);
    }).finally(() => setIsLoading(false));
  }, [runReporting]);

  // Creation takes only name and folder; sharing is a separate request on the new project.
  const createProject = (settings: ProjectSettings) => runReporting('Create project', async () => {
    let project = await projectApi.createProject(settings.name, settings.folderId);
    if (settings.isShared) project = await projectApi.shareProject(project.id);
    log('info', MODULE, 'Project created', { projectId: project.id });
    setProjects(current => [project, ...current]);
    return project;
  });

  // The server has no combined update endpoint, so only the changed settings are sent, one request each.
  const editProject = (project: Project, settings: ProjectSettings) => runReporting('Edit project', async () => {
    let edited = project;
    if (settings.name !== project.name) edited = await projectApi.renameProject(project.id, settings.name);
    if (settings.folderId !== project.folderId) edited = await projectApi.moveProjectToFolder(project.id, settings.folderId);
    if (settings.isShared !== (project.shareToken !== null)) {
      edited = await (settings.isShared ? projectApi.shareProject : projectApi.unshareProject)(project.id);
    }
    log('info', MODULE, 'Project edited', { projectId: project.id });
    setProjects(current => replaceById(current, edited));
  });

  const moveProjectToTrash = (project: Project) => runReporting('Move project to trash', async () => {
    const trashed = await projectApi.moveProjectToTrash(project.id);
    log('info', MODULE, 'Project moved to trash', { projectId: project.id });
    setProjects(current => withoutId(current, project.id));
    setTrashedProjects(current => [trashed, ...current]);
  });

  const restoreProject = (project: TrashedProject) => runReporting('Restore project', async () => {
    const restored = await projectApi.restoreProject(project.id);
    log('info', MODULE, 'Project restored', { projectId: project.id });
    setTrashedProjects(current => withoutId(current, project.id));
    setProjects(current => [restored, ...current]);
  });

  const deleteProjectPermanently = (project: TrashedProject) => runReporting('Delete project permanently', async () => {
    await projectApi.deleteProjectPermanently(project.id);
    log('info', MODULE, 'Project deleted permanently', { projectId: project.id });
    setTrashedProjects(current => withoutId(current, project.id));
  });

  const createFolder = (name: string) => runReporting('Create folder', async () => {
    const folder = await folderApi.createFolder(name);
    log('info', MODULE, 'Folder created', { folderId: folder.id });
    setFolders(current => [...current, folder]);
  });

  const renameFolder = (folder: Folder, name: string) => runReporting('Rename folder', async () => {
    const renamed = await folderApi.renameFolder(folder.id, name);
    setFolders(current => replaceById(current, renamed));
  });

  // Mirrors the server, which detaches the folder's projects (trashed ones too) instead of deleting them.
  const deleteFolder = (folder: Folder) => runReporting('Delete folder', async () => {
    await folderApi.deleteFolder(folder.id);
    log('info', MODULE, 'Folder deleted', { folderId: folder.id });
    setFolders(current => withoutId(current, folder.id));
    const detach = <T extends Project>(items: T[]) => items.map(item => (item.folderId === folder.id ? { ...item, folderId: null } : item));
    setProjects(detach);
    setTrashedProjects(detach);
  });

  return {
    isLoading,
    failure,
    projects,
    trashedProjects,
    folders,
    createProject,
    editProject,
    moveProjectToTrash,
    restoreProject,
    deleteProjectPermanently,
    createFolder,
    renameFolder,
    deleteFolder,
  };
}

export type ProjectLibrary = ReturnType<typeof useProjectLibrary>;
