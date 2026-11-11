import { Check, Copy, FileCode, Image as ImageIcon } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { shareProject, unshareProject, type Project } from '../../entities/project/project-api';
import { useI18n } from '../../shared/i18n/language-context';
import type { MessageKey } from '../../shared/i18n/message';
import { log, serializeError } from '../../shared/lib/logger';
import { iconButtonClass } from '../../shared/ui/control-class';
import { ShareVisibilityRow } from './ShareVisibilityRow';

const COPIED_FEEDBACK_MS = 1500;

const SHARED_FILES: { labelKey: MessageKey; extension: string; Icon: ComponentType<{ className?: string }> }[] = [
  { labelKey: 'share.drawioFile', extension: 'drawio', Icon: FileCode },
  { labelKey: 'share.svgImage', extension: 'svg', Icon: ImageIcon },
  { labelKey: 'share.pngImage', extension: 'png', Icon: ImageIcon },
];

function sharedFileUrl(shareToken: string, extension: string): string {
  return `${window.location.origin}/api/share/${shareToken}/diagram.${extension}`;
}

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
        <div className="text-ui text-ink">{label}</div>
        <div className="truncate font-mono text-2xs text-ink-faint">{url}</div>
      </div>
      <button type="button" onClick={copyUrl} aria-label={t('share.copyNamedLink', { label })} title={t('share.copyLink')} className={iconButtonClass('ghost', 'sm')}>
        {isCopied ? <Check className="text-success" /> : <Copy />}
      </button>
    </div>
  );
}

type SharePanelProps = {
  project: Project;
  onProjectChange: (project: Project) => void;
};

export function SharePanel({ project, onProjectChange }: SharePanelProps) {
  const { t } = useI18n();
  const [isUpdating, setIsUpdating] = useState(false);
  const { shareToken } = project;
  const isShared = shareToken !== null;

  const changeVisibility = async (shouldShare: boolean) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      onProjectChange(await (shouldShare ? shareProject : unshareProject)(project.id));
    } catch (error) {
      log('error', 'ProjectShare', 'Change share visibility failed', { projectId: project.id, shouldShare, ...serializeError(error) });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-[360px] max-w-[calc(100vw-24px)] rounded-xl bg-surface p-1.5 shadow-pop">
      <ShareVisibilityRow isShared={isShared} onChange={shouldShare => void changeVisibility(shouldShare)} className="p-2.5" />
      {shareToken !== null && (
        <div className="animate-fade-in space-y-px border-t border-line px-0.5 pt-1.5 pb-0.5">
          {SHARED_FILES.map(file => (
            <CopyableLink key={file.extension} label={t(file.labelKey)} Icon={file.Icon} url={sharedFileUrl(shareToken, file.extension)} />
          ))}
        </div>
      )}
    </div>
  );
}
