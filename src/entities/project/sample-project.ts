// Static placeholder content while the UI is being redesigned.

export type ProjectSummary = {
  id: string;
  name: string;
  updatedLabel: string;
  isShared: boolean;
};

export const SAMPLE_PROJECTS: ProjectSummary[] = [
  { id: 'payment-gateway', name: '支付网关 v3', updatedLabel: '2 分钟前', isShared: true },
  { id: 'realtime-pipeline', name: '实时数据管道', updatedLabel: '今天 10:24', isShared: true },
  { id: 'k8s-multi-cluster', name: 'K8s 多集群部署', updatedLabel: '昨天', isShared: false },
  { id: 'rag-service', name: 'RAG 检索服务', updatedLabel: '昨天', isShared: false },
  { id: 'blog-infra', name: '博客基础设施', updatedLabel: '11月8日', isShared: true },
  { id: 'recommendation-recall', name: '推荐系统召回链路', updatedLabel: '11月6日', isShared: false },
];

export const SAMPLE_SHARE_TOKEN = 'sample-share-token';

export function findSampleProject(projectId: string): ProjectSummary {
  return SAMPLE_PROJECTS.find(project => project.id === projectId) ?? { id: projectId, name: '未命名项目', updatedLabel: '刚刚', isShared: false };
}
