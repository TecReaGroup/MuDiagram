// Static placeholder content while the UI is being redesigned.

export type FolderSummary = {
  id: string;
  name: string;
  diagramCount: number;
};

export const SAMPLE_FOLDERS: FolderSummary[] = [
  { id: 'architecture', name: '架构设计', diagramCount: 3 },
  { id: 'data-platform', name: '数据平台', diagramCount: 2 },
];
