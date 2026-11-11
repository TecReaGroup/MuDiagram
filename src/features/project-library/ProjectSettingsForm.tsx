import { Globe, Lock, X } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import type { Folder } from '../../entities/folder/folder-api';
import { useI18n } from '../../shared/i18n/language-context';
import { buttonClass, FIELD_INPUT_CLASS, iconButtonClass } from '../../shared/ui/control-class';
import { FormField } from '../../shared/ui/FormField';
import { SelectMenu } from '../../shared/ui/SelectMenu';
import { Switch } from '../../shared/ui/Switch';
import type { ProjectSettings } from './use-project-library';

type ProjectSettingsFormProps = {
  titleId: string;
  title: string;
  initialSettings: ProjectSettings;
  folders: Folder[];
  submitLabel: string;
  /** Rendered centered between Cancel and the submit button. */
  middleAction?: ReactNode;
  onSubmit: (settings: ProjectSettings) => void;
  onCancel: () => void;
};

/** Name, folder and sharing form shared by the create and edit dialogs. */
export function ProjectSettingsForm({ titleId, title, initialSettings, folders, submitLabel, middleAction, onSubmit, onCancel }: ProjectSettingsFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialSettings.name);
  const [folderId, setFolderId] = useState(initialSettings.folderId);
  const [isShared, setIsShared] = useState(initialSettings.isShared);
  const trimmedName = name.trim();
  const VisibilityIcon = isShared ? Globe : Lock;

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name: trimmedName, folderId, isShared });
  }

  return (
    <form onSubmit={submit}>
      <header className="flex items-center justify-between px-6 pt-5">
        <h2 id={titleId} className="text-base font-semibold">{title}</h2>
        <button type="button" onClick={onCancel} aria-label={t('common.close')} className={`${iconButtonClass('ghost', 'md')} -mr-2`}>
          <X />
        </button>
      </header>

      <div className="space-y-5 px-6 pt-5 pb-6">
        <FormField label={t('project.name')}>
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            onFocus={event => event.currentTarget.select()}
            autoFocus
            required
            className={FIELD_INPUT_CLASS}
          />
        </FormField>

        <FormField label={t('project.folder')}>
          <SelectMenu
            value={folderId}
            options={[{ value: null, label: t('folder.none') }, ...folders.map(folder => ({ value: folder.id, label: folder.name }))]}
            onChange={setFolderId}
          />
        </FormField>

        <div className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isShared ? 'bg-success-soft text-success' : 'bg-sunken text-ink-muted'}`}>
            <VisibilityIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium">{t('share.public')}</div>
            <div className="text-xs text-ink-muted">{t(isShared ? 'share.publicHint' : 'share.privateHint')}</div>
          </div>
          <Switch checked={isShared} label={t('share.public')} onChange={setIsShared} />
        </div>
      </div>

      {/* Equal side columns keep the middle action centered whatever the button widths. */}
      <footer className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-line px-6 py-4">
        <button type="button" onClick={onCancel} className={`${buttonClass('secondary', 'lg')} justify-self-start`}>
          {t('common.cancel')}
        </button>
        <div>{middleAction}</div>
        <button type="submit" disabled={!trimmedName} className={`${buttonClass('primary', 'lg')} justify-self-end`}>
          {submitLabel}
        </button>
      </footer>
    </form>
  );
}
