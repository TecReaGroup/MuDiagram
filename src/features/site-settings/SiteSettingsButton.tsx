import { Info, Languages, Settings, Sparkle, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useI18n } from '../../shared/i18n/language-context';
import { iconButtonClass, MODAL_DIALOG_CLASS, NAV_ITEM_CLASS } from '../../shared/ui/control-class';
import { AboutSettingsSection } from './AboutSettingsSection';
import { AiModelSettingsSection } from './AiModelSettingsSection';
import { LanguageSettingsSection } from './LanguageSettingsSection';

const SETTINGS_SECTIONS = [
  { id: 'ai-model', titleKey: 'settings.ai.title', descriptionKey: 'settings.ai.description', Icon: Sparkle, Content: AiModelSettingsSection },
  { id: 'language', titleKey: 'settings.language.title', descriptionKey: 'settings.language.description', Icon: Languages, Content: LanguageSettingsSection },
  { id: 'about', titleKey: 'settings.about.title', descriptionKey: 'settings.about.description', Icon: Info, Content: AboutSettingsSection },
] as const;

type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

export function SiteSettingsButton() {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<SettingsSectionId>(SETTINGS_SECTIONS[0].id);
  const activeSection = SETTINGS_SECTIONS.find(section => section.id === activeSectionId) ?? SETTINGS_SECTIONS[0];

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label={t('settings.title')} title={t('settings.title')} className={iconButtonClass('ghost', 'xl')}>
        <Settings />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="site-settings-title"
        // A click whose target is the <dialog> itself landed on the backdrop.
        onClick={event => event.target === dialogRef.current && dialogRef.current.close()}
        className={`${MODAL_DIALOG_CLASS} h-[min(760px,calc(100vh-48px))] w-[min(1120px,calc(100vw-48px))] overflow-hidden p-0`}
      >
        <div className="flex h-full flex-col sm:flex-row">
          <aside className="shrink-0 border-b border-line bg-canvas p-3 sm:w-64 sm:border-r sm:border-b-0 sm:p-5">
            <h2 id="site-settings-title" className="px-3 pt-1 pb-5 text-xl font-semibold max-sm:hidden">{t('settings.title')}</h2>
            <nav className="flex gap-1 sm:flex-col">
              {SETTINGS_SECTIONS.map(({ id, titleKey, Icon }) => {
                const isActive = id === activeSectionId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSectionId(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${NAV_ITEM_CLASS} max-sm:w-auto`}
                  >
                    <Icon />
                    {t(titleKey)}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="relative min-h-0 flex-1 overflow-y-auto px-6 py-8 scrollbar-subtle sm:px-14 sm:py-14">
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label={t('common.close')} className={`${iconButtonClass()} absolute top-5 right-5`}>
              <X />
            </button>
            <div key={activeSection.id} className="max-w-xl animate-fade-in">
              <h3 className="text-2xl font-semibold">{t(activeSection.titleKey)}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{t(activeSection.descriptionKey)}</p>
              <div className="mt-8">
                <activeSection.Content />
              </div>
            </div>
          </section>
        </div>
      </dialog>
    </>
  );
}
