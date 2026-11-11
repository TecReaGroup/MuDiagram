import { Globe, Lock } from 'lucide-react';
import { useI18n } from '../../shared/i18n/language-context';
import { Switch } from '../../shared/ui/Switch';

type ShareVisibilityRowProps = {
  isShared: boolean;
  onChange: (isShared: boolean) => void;
  /** Padding and framing; the row lays out its own contents. */
  className?: string;
};

/** Public / private switch with an icon and a hint that both follow the current visibility. */
export function ShareVisibilityRow({ isShared, onChange, className = '' }: ShareVisibilityRowProps) {
  const { t } = useI18n();
  const VisibilityIcon = isShared ? Globe : Lock;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors ${isShared ? 'bg-success-soft text-success' : 'bg-sunken text-ink-muted'}`}>
        <VisibilityIcon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-ui font-medium">{t('share.public')}</div>
        <div className="text-xs text-ink-muted">{t(isShared ? 'share.publicHint' : 'share.privateHint')}</div>
      </div>
      <Switch checked={isShared} label={t('share.public')} onChange={onChange} />
    </div>
  );
}
