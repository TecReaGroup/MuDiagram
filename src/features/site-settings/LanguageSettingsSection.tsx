import { Check } from 'lucide-react';
import { useI18n } from '../../shared/i18n/language-context';
import { LANGUAGE_NATIVE_NAMES, LANGUAGES } from '../../shared/i18n/message';

export function LanguageSettingsSection() {
  const { language, t, changeLanguage } = useI18n();

  return (
    <div role="radiogroup" aria-label={t('settings.language.title')} className="space-y-2.5">
      {LANGUAGES.map(option => {
        const isSelected = option === language;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => !isSelected && changeLanguage(option)}
            className={`flex w-full items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-left transition-[border-color,box-shadow] ${isSelected ? 'border-line-strong shadow-card' : 'border-line hover:border-line-strong'}`}
          >
            <span className="min-w-0 flex-1">
              <span lang={option} className="block text-sm font-medium text-ink">{LANGUAGE_NATIVE_NAMES[option]}</span>
              <span className="block text-xs text-ink-muted">{t(`settings.language.${option}`)}</span>
            </span>
            {isSelected && <Check className="size-4 shrink-0 text-ink" />}
          </button>
        );
      })}
    </div>
  );
}
