import { X } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import type { Folder } from '../../entities/folder/folder-api';
import { useI18n } from '../../shared/i18n/language-context';
import { buttonClass, FIELD_INPUT_CLASS, iconButtonClass } from '../../shared/ui/control-class';
import { FormField } from '../../shared/ui/FormField';
import { SelectMenu } from '../../shared/ui/SelectMenu';
import { DIALOG_TITLE_CLASS } from '../../shared/ui/text-class';
import { ShareVisibilityRow } from '../project-share/ShareVisibilityRow';
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

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name: trimmedName, folderId, isShared });
  }

  return (
    <form onSubmit={submit}>
      <header className="flex items-center justify-between px-6 pt-5">
        <h2 id={titleId} className={DIALOG_TITLE_CLASS}>{title}</h2>
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

        <ShareVisibilityRow isShared={isShared} onChange={setIsShared} className="rounded-xl border border-line px-3.5 py-3" />
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
