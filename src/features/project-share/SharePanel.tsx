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
import { DESTRUCTIVE_BUTTON_CLASS, OUTLINE_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from '../../shared/ui/control-class';

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
      <div className="text-xs font-medium text-foreground/70">{label}</div>
      <div className="flex gap-2">
        <input readOnly value={url} className="h-8 min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface-1 px-2.5 font-mono text-[11px] text-muted-foreground outline-none focus:border-ring" />
        <button type="button" onClick={() => void copyUrl()} className={`${OUTLINE_BUTTON_CLASS} text-xs`}>
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
    <div className="w-96 max-w-[calc(100vw-24px)] space-y-4 rounded-2xl bg-popover p-4 shadow-pop">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold tracking-[-0.01em]">分享</div>
          <div className="text-xs text-muted-foreground">{shareToken ? '任何拿到链接的人都可以查看和下载' : '当前仅自己可见'}</div>
        </div>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void updateShare(shareToken ? disableShare : enableShare)}
          className={shareToken ? DESTRUCTIVE_BUTTON_CLASS : PRIMARY_BUTTON_CLASS}
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
      {failure && <p className="text-xs text-destructive">{failure}</p>}
    </div>
  );
}
