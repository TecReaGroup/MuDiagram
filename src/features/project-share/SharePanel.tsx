import { useState } from 'react';
import {
  disableShare,
  enableShare,
  sharedDiagramUrl,
  sharePageUrl,
  type DiagramFileExtension,
  type Project,
} from '../../entities/project/project-api';
import { log, serializeError } from '../../shared/lib/logger';

const SHARED_FILES: { extension: DiagramFileExtension; label: string }[] = [
  { extension: 'drawio', label: 'Draw.io 源文件' },
  { extension: 'svg', label: 'SVG 图片' },
  { extension: 'png', label: 'PNG 图片' },
];

function CopyableLink({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="flex gap-2">
        <input readOnly value={url} className="min-w-0 flex-1 rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-xs" />
        <button type="button" onClick={() => void copyUrl()} className="shrink-0 rounded border border-slate-300 px-2 text-xs hover:bg-slate-50">
          {copied ? '已复制' : '复制'}
        </button>
      </div>
    </div>
  );
}

type SharePanelProps = {
  project: Project;
  onProjectChange: (project: Project) => void;
};

export function SharePanel({ project, onProjectChange }: SharePanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function updateShare(changeShare: (projectId: string) => Promise<Project>) {
    setIsUpdating(true);
    setFailure(null);
    try {
      onProjectChange(await changeShare(project.id));
    } catch (error) {
      log('error', 'ProjectShare', 'Share update failed', { projectId: project.id, ...serializeError(error) });
      setFailure(error instanceof Error ? error.message : String(error));
    } finally {
      setIsUpdating(false);
    }
  }

  const { shareToken } = project;
  return (
    <div className="w-96 space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-800">分享</div>
          <div className="text-xs text-slate-500">{shareToken ? '任何拿到链接的人都可以查看和下载' : '当前仅自己可见'}</div>
        </div>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void updateShare(shareToken ? disableShare : enableShare)}
          className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${shareToken ? 'border border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
        >
          {shareToken ? '停止分享' : '开启分享'}
        </button>
      </div>
      {shareToken && (
        <div className="space-y-3">
          <CopyableLink label="分享页面" url={sharePageUrl(shareToken)} />
          {SHARED_FILES.map(({ extension, label }) => (
            <CopyableLink key={extension} label={`API · ${label}`} url={sharedDiagramUrl(shareToken, extension)} />
          ))}
        </div>
      )}
      {failure && <p className="text-xs text-rose-600">{failure}</p>}
    </div>
  );
}
