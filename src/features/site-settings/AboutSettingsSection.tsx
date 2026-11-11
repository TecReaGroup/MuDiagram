import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';

export function AboutSettingsSection() {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line px-4 py-4">
      <BrandMark className="size-11" />
      <div>
        <div className="text-[15px] font-semibold tracking-[-0.02em]">MuDiagram</div>
        <div className="text-[13px] text-ink-muted">{t('settings.about.tagline')}</div>
      </div>
    </div>
  );
}
