import { Check, Copy, FileCode, Globe, Image as ImageIcon, Link2, Lock } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { SAMPLE_SHARE_TOKEN } from '../../entities/project/sample-project';
import { useI18n } from '../../shared/i18n/language-context';
import type { MessageKey } from '../../shared/i18n/message';
import { iconButtonClass } from '../../shared/ui/control-class';
import { Switch } from '../../shared/ui/Switch';

const COPIED_FEEDBACK_MS = 1500;

const SHARED_LINKS: { labelKey: MessageKey; path: string; Icon: ComponentType<{ className?: string }> }[] = [
  { labelKey: 'share.page', path: `/share/${SAMPLE_SHARE_TOKEN}`, Icon: Link2 },
  { labelKey: 'share.drawioFile', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.drawio`, Icon: FileCode },
  { labelKey: 'share.svgImage', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.svg`, Icon: ImageIcon },
  { labelKey: 'share.pngImage', path: `/api/share/${SAMPLE_SHARE_TOKEN}/diagram.png`, Icon: ImageIcon },
];

function CopyableLink({ label, url, Icon }: { label: string; url: string; Icon: ComponentType<{ className?: string }> }) {
  const { t } = useI18n();
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
      <button type="button" onClick={copyUrl} aria-label={t('share.copyNamedLink', { label })} title={t('share.copyLink')} className={iconButtonClass('ghost', 'sm')}>
        {isCopied ? <Check className="text-success" /> : <Copy />}
      </button>
    </div>
  );
}

export function SharePanel({ initiallyShared }: { initiallyShared: boolean }) {
  const { t } = useI18n();
  const [isShared, setIsShared] = useState(initiallyShared);
  const VisibilityIcon = isShared ? Globe : Lock;

  return (
    <div className="w-[360px] max-w-[calc(100vw-24px)] rounded-xl bg-surface p-1.5 shadow-pop">
      <div className="flex items-center gap-3 p-2.5">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors ${isShared ? 'bg-success-soft text-success' : 'bg-sunken text-ink-muted'}`}>
          <VisibilityIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">{t('share.public')}</div>
          <div className="text-xs text-ink-muted">{t(isShared ? 'share.publicHint' : 'share.privateHint')}</div>
        </div>
        <Switch checked={isShared} label={t('share.public')} onChange={setIsShared} />
      </div>
      {isShared && (
        <div className="animate-fade-in space-y-px border-t border-line px-0.5 pt-1.5 pb-0.5">
          {SHARED_LINKS.map(link => <CopyableLink key={link.path} label={t(link.labelKey)}Icon={link.Icon} url={`${window.location.origin}${link.path}`} />)}
        </div>
      )}
    </div>
  );
}
