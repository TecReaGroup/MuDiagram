import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getDiagramXml, getProject, listProjects, listTrashedProjects, type Project } from './project-api';

// A prefetched diagram (card hover) is trusted this long; saves from this tab keep it current anyway.
const DIAGRAM_XML_STALE_TIME_MS = 10_000;

const projectDetailKey = (projectId: string) => ['project', 'detail', projectId] as const;
const diagramXmlKey = (projectId: string) => ['project', 'diagram-xml', projectId] as const;

export const projectListQuery = queryOptions({ queryKey: ['project', 'list'], queryFn: listProjects });

export const trashedProjectListQuery = queryOptions({ queryKey: ['project', 'trash'], queryFn: listTrashedProjects });

export const diagramXmlQuery = (projectId: string) => queryOptions({
  queryKey: diagramXmlKey(projectId),
  queryFn: () => getDiagramXml(projectId),
  staleTime: DIAGRAM_XML_STALE_TIME_MS,
});

/** The project, shown at once from the library list when it is cached, then revalidated. */
export function useProject(projectId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: projectDetailKey(projectId),
    queryFn: () => getProject(projectId),
    placeholderData: () => queryClient.getQueryData(projectListQuery.queryKey)?.find(project => project.id === projectId),
  });
}

/** Writes a project the server just returned into every cached view of it. */
export function storeProject(queryClient: QueryClient, project: Project) {
  queryClient.setQueryData(projectDetailKey(project.id), project);
  queryClient.setQueryData(projectListQuery.queryKey, current =>
    current?.map(cached => (cached.id === project.id ? project : cached)));
}

/** Records a diagram this tab just saved, so reopening the project needs no download. */
export function storeDiagramXml(queryClient: QueryClient, projectId: string, xml: string) {
  queryClient.setQueryData(diagramXmlKey(projectId), xml);
}

export function forgetProject(queryClient: QueryClient, projectId: string) {
  queryClient.removeQueries({ queryKey: projectDetailKey(projectId) });
  queryClient.removeQueries({ queryKey: diagramXmlKey(projectId) });
}
