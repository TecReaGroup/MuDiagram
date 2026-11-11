import type { Project } from '../../entities/project/project-api';

const NAME_COLLATOR = new Intl.Collator('zh-CN');

export const VISIBILITY_TABS = [
  { id: 'all', label: '全部', includes: (_project: Project) => true },
  { id: 'public', label: '公开', includes: (project: Project) => project.shareToken !== null },
  { id: 'private', label: '私有', includes: (project: Project) => project.shareToken === null },
] as const;

export const SORT_ORDERS = [
  { id: 'updated', label: '最近修改', compare: (a: Project, b: Project) => b.updatedAt.localeCompare(a.updatedAt) },
  { id: 'created', label: '最近创建', compare: (a: Project, b: Project) => b.createdAt.localeCompare(a.createdAt) },
  { id: 'name', label: '名称', compare: (a: Project, b: Project) => NAME_COLLATOR.compare(a.name, b.name) },
] as const;

export type VisibilityTabId = (typeof VISIBILITY_TABS)[number]['id'];
export type SortOrderId = (typeof SORT_ORDERS)[number]['id'];

export type LibraryQuery = {
  visibilityId: VisibilityTabId;
  sortId: SortOrderId;
  searchText: string;
};

export function matchesSearch(project: Project, searchText: string): boolean {
  const needle = searchText.trim().toLowerCase();
  return !needle || project.name.toLowerCase().includes(needle);
}

export function selectProjects(projects: Project[], query: LibraryQuery): Project[] {
  const visibility = VISIBILITY_TABS.find(tab => tab.id === query.visibilityId)!;
  const sortOrder = SORT_ORDERS.find(order => order.id === query.sortId)!;
  return projects
    .filter(project => visibility.includes(project) && matchesSearch(project, query.searchText))
    .sort(sortOrder.compare);
}
