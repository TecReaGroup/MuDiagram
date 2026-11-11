import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';
import { FIELD_FOCUS_CLASS } from '../../shared/ui/control-class';

const REPOSITORY_URL = 'https://github.com/TecReaGroup/MuDiagram';

export function AboutSettingsSection() {
  const { t } = useI18n();

  return (
    <a
      href={REPOSITORY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-4 rounded-xl border border-line px-4 py-4 outline-none hover:border-line-strong hover:bg-surface ${FIELD_FOCUS_CLASS}`}
    >
      <BrandMark className="size-11" />
      <div>
        <div className="text-[15px] font-semibold tracking-[-0.02em]">MuDiagram</div>
        <div className="text-ui text-ink-muted">{t('settings.about.tagline')}</div>
      </div>
    </a>
  );
}
