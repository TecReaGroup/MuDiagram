import { Info, Languages, Settings, Sparkle, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { iconButtonClass, NAV_ITEM_CLASS } from '../../shared/ui/control-class';
import { AboutSettingsSection } from './AboutSettingsSection';
import { AiModelSettingsSection } from './AiModelSettingsSection';
import { LanguageSettingsSection } from './LanguageSettingsSection';

const SETTINGS_SECTIONS = [
  { id: 'ai-model', label: 'AI 模型', title: 'AI 模型', description: '配置 AI 助手生成图表时使用的模型服务。', Icon: Sparkle, Content: AiModelSettingsSection },
  { id: 'language', label: '语言', title: '语言', description: '选择界面显示的语言。', Icon: Languages, Content: LanguageSettingsSection },
  { id: 'about', label: '关于', title: '关于', description: '关于 MuDiagram。', Icon: Info, Content: AboutSettingsSection },
] as const;

type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id'];

export function SiteSettingsButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<SettingsSectionId>(SETTINGS_SECTIONS[0].id);
  const activeSection = SETTINGS_SECTIONS.find(section => section.id === activeSectionId) ?? SETTINGS_SECTIONS[0];

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label="设置" title="设置" className={iconButtonClass('ghost', 'xl')}>
        <Settings />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="site-settings-title"
        // A click whose target is the <dialog> itself landed on the backdrop.
        onClick={event => event.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto h-[min(760px,calc(100vh-48px))] w-[min(1120px,calc(100vw-48px))] overflow-hidden rounded-2xl bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/30 backdrop:backdrop-blur-[2px] open:animate-pop-in"
      >
        <div className="flex h-full flex-col sm:flex-row">
          <aside className="shrink-0 border-b border-line bg-canvas p-3 sm:w-64 sm:border-r sm:border-b-0 sm:p-5">
            <h2 id="site-settings-title" className="px-3 pt-1 pb-5 text-xl font-semibold max-sm:hidden">设置</h2>
            <nav className="flex gap-1 sm:flex-col">
              {SETTINGS_SECTIONS.map(({ id, label, Icon }) => {
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
                    {label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="relative min-h-0 flex-1 overflow-y-auto px-6 py-8 scrollbar-thin sm:px-14 sm:py-14">
            <button type="button" onClick={() => dialogRef.current?.close()} aria-label="关闭" className={`${iconButtonClass()} absolute top-5 right-5`}>
              <X />
            </button>
            <div key={activeSection.id} className="max-w-xl animate-fade-in">
              <h3 className="text-2xl font-semibold">{activeSection.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{activeSection.description}</p>
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
