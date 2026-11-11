import { useState } from 'react';
import { SAMPLE_SHARE_TOKEN } from '../../entities/project/sample-project';
import { DESTRUCTIVE_BUTTON_CLASS, OUTLINE_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from '../../shared/ui/control-class';

const SHARED_LINKS = [
  { label: '分享页面', path: `/share/${SAMPLE_SHARE_TOKEN}` },
  { label: 'API · Draw.io 源文件', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.drawio` },
  { label: 'API · SVG 图片', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.svg` },
  { label: 'API · PNG 图片', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.png` },
];

function CopyableLink({ label, url }: { label: string; url: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-foreground/70">{label}</div>
      <div className="flex gap-2">
        <input readOnly value={url} className="h-8 min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface-1 px-2.5 font-mono text-[11px] text-muted-foreground outline-none focus:border-ring" />
        <button type="button" className={`${OUTLINE_BUTTON_CLASS} text-xs`}>复制</button>
      </div>
    </div>
  );
}

export function SharePanel({ initiallyShared }: { initiallyShared: boolean }) {
  const [isShared, setIsShared] = useState(initiallyShared);

  return (
    <div className="w-96 max-w-[calc(100vw-24px)] space-y-4 rounded-2xl bg-popover p-4 shadow-pop">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold tracking-[-0.01em]">分享</div>
          <div className="text-xs text-muted-foreground">{isShared ? '任何拿到链接的人都可以查看和下载' : '当前仅自己可见'}</div>
        </div>
        <button type="button" onClick={() => setIsShared(shared => !shared)} className={isShared ? DESTRUCTIVE_BUTTON_CLASS : PRIMARY_BUTTON_CLASS}>
          {isShared ? '停止分享' : '开启分享'}
        </button>
      </div>
      {isShared && (
        <div className="space-y-3">
          {SHARED_LINKS.map(link => <CopyableLink key={link.path} label={link.label} url={`${window.location.origin}${link.path}`} />)}
        </div>
      )}
    </div>
  );
}
