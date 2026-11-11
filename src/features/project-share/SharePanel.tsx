import { Check, Copy, FileCode, Globe, Image as ImageIcon, Link2, Lock } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { SAMPLE_SHARE_TOKEN } from '../../entities/project/sample-project';
import { FOCUS_RING, iconButtonClass } from '../../shared/ui/control-class';

const COPIED_FEEDBACK_MS = 1500;

const SHARED_LINKS: { label: string; path: string; Icon: ComponentType<{ className?: string }> }[] = [
  { label: '分享页面', path: `/share/${SAMPLE_SHARE_TOKEN}`, Icon: Link2 },
  { label: 'Draw.io 源文件', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.drawio`, Icon: FileCode },
  { label: 'SVG 图片', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.svg`, Icon: ImageIcon },
  { label: 'PNG 图片', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.png`, Icon: ImageIcon },
];

function CopyableLink({ label, url, Icon }: { label: string; url: string; Icon: ComponentType<{ className?: string }> }) {
  const [isCopied, setIsCopied] = useState(false);

  const copyUrl = () => {
    void navigator.clipboard.writeText(url);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-sunken">
      <Icon className="size-4 shrink-0 text-ink-faint" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-ink">{label}</div>
        <div className="truncate font-mono text-[11px] text-ink-faint">{url}</div>
      </div>
      <button type="button" onClick={copyUrl} aria-label={`复制${label}链接`} title="复制链接" className={iconButtonClass('ghost', 'sm')}>
        {isCopied ? <Check className="text-success" /> : <Copy />}
      </button>
    </div>
  );
}

export function SharePanel({ initiallyShared }: { initiallyShared: boolean }) {
  const [isShared, setIsShared] = useState(initiallyShared);
  const VisibilityIcon = isShared ? Globe : Lock;

  return (
    <div className="w-[360px] max-w-[calc(100vw-24px)] rounded-xl bg-surface p-1.5 shadow-pop">
      <div className="flex items-center gap-3 p-2.5">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors ${isShared ? 'bg-success-soft text-success' : 'bg-sunken text-ink-muted'}`}>
          <VisibilityIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">公开分享</div>
          <div className="text-xs text-ink-muted">{isShared ? '任何拿到链接的人都可以查看和下载' : '当前仅自己可见'}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isShared}
          aria-label="公开分享"
          onClick={() => setIsShared(shared => !shared)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${FOCUS_RING} ${isShared ? 'bg-success' : 'bg-line-strong'}`}
        >
          <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-xs transition-transform duration-200 ease-out ${isShared ? 'translate-x-4' : ''}`} />
        </button>
      </div>
      {isShared && (
        <div className="animate-fade-in space-y-px border-t border-line px-0.5 pt-1.5 pb-0.5">
          {SHARED_LINKS.map(link => <CopyableLink key={link.path} label={link.label} Icon={link.Icon} url={`${window.location.origin}${link.path}`} />)}
        </div>
      )}
    </div>
  );
}
