import { useCallback, useEffect, useState } from 'react';
import {
  createProject,
  deleteProject,
  listProjects,
  renameProject,
  type Project,
} from '../../entities/project/project-api';
import { log, serializeError } from '../../shared/lib/logger';

/** The Library's project list with the operations that change it. */
export function useProjectLibrary() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const runReporting = useCallback(async <T,>(action: string, operation: () => Promise<T>): Promise<T | undefined> => {
    setFailure(null);
    try {
      return await operation();
    } catch (error) {
      log('error', 'ProjectLibrary', `${action} failed`, serializeError(error));
      setFailure(error instanceof Error ? error.message : String(error));
      return undefined;
    }
  }, []);

  useEffect(() => {
    void runReporting('List projects', async () => setProjects(await listProjects()));
  }, [runReporting]);

  const create = (name: string) => runReporting('Create project', async () => {
    const project = await createProject(name);
    setProjects(current => [project, ...(current ?? [])]);
    return project;
  });

  const rename = (project: Project, name: string) => runReporting('Rename project', async () => {
    const renamed = await renameProject(project.id, name);
    setProjects(current => current?.map(candidate => (candidate.id === renamed.id ? renamed : candidate)) ?? null);
  });

  const remove = (project: Project) => runReporting('Delete project', async () => {
    await deleteProject(project.id);
    setProjects(current => current?.filter(candidate => candidate.id !== project.id) ?? null);
  });

  return { projects, failure, create, rename, remove };
}
