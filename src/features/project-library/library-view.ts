import type { Project } from '../../entities/project/project-api';

const RECENT_WINDOW_DAYS = 7;
const RECENT_WINDOW_MS = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

type ProjectFilter<Id extends string> = { id: Id; label: string; includes: (project: Project) => boolean };

export const LIBRARY_SECTIONS = [
  { id: 'all', label: '全部项目', includes: () => true },
  { id: 'recent', label: '最近编辑', includes: project => Date.now() - Date.parse(project.updatedAt) < RECENT_WINDOW_MS },
] as const satisfies readonly ProjectFilter<string>[];

export const VISIBILITY_TABS = [
  { id: 'all', label: '全部', includes: () => true },
  { id: 'public', label: '公开链接', includes: project => project.shareToken !== null },
  { id: 'private', label: '私有', includes: project => project.shareToken === null },
] as const satisfies readonly ProjectFilter<string>[];

const NAME_COLLATOR = new Intl.Collator('zh-CN');

export const SORT_ORDERS = [
  { id: 'updated', label: '最近修改', compare: (a: Project, b: Project) => b.updatedAt.localeCompare(a.updatedAt) },
  { id: 'created', label: '最近创建', compare: (a: Project, b: Project) => b.createdAt.localeCompare(a.createdAt) },
  { id: 'name', label: '名称', compare: (a: Project, b: Project) => NAME_COLLATOR.compare(a.name, b.name) },
] as const;

export type LibrarySectionId = (typeof LIBRARY_SECTIONS)[number]['id'];
export type VisibilityTabId = (typeof VISIBILITY_TABS)[number]['id'];
export type SortOrderId = (typeof SORT_ORDERS)[number]['id'];

export type LibraryQuery = {
  sectionId: LibrarySectionId;
  visibilityId: VisibilityTabId;
  sortId: SortOrderId;
  searchText: string;
};

export function countProjectsInSection(projects: Project[], sectionId: LibrarySectionId): number {
  const section = LIBRARY_SECTIONS.find(candidate => candidate.id === sectionId)!;
  return projects.filter(section.includes).length;
}

export function selectProjects(projects: Project[], query: LibraryQuery): Project[] {
  const section = LIBRARY_SECTIONS.find(candidate => candidate.id === query.sectionId)!;
  const visibility = VISIBILITY_TABS.find(candidate => candidate.id === query.visibilityId)!;
  const sortOrder = SORT_ORDERS.find(candidate => candidate.id === query.sortId)!;
  const needle = query.searchText.trim().toLowerCase();
  return projects
    .filter(project => section.includes(project) && visibility.includes(project))
    .filter(project => !needle || project.name.toLowerCase().includes(needle))
    .sort(sortOrder.compare);
}
