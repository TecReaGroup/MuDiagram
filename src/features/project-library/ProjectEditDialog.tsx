import { Pencil, Trash } from 'lucide-react';
import { useId, useState } from 'react';
import type { Folder } from '../../entities/folder/folder-api';
import type { Project } from '../../entities/project/project-api';
import { useI18n } from '../../shared/i18n/language-context';
import { buttonClass, iconButtonClass } from '../../shared/ui/control-class';
import { Modal } from '../../shared/ui/Modal';
import { ProjectSettingsForm } from './ProjectSettingsForm';
import type { ProjectSettings } from './use-project-library';

type ProjectEditDialogProps = {
  project: Project;
  folders: Folder[];
  onSave: (settings: ProjectSettings) => void;
  onMoveToTrash: () => void;
};

/** Pencil button that opens a form for the project's name, folder and sharing. */
export function ProjectEditDialog({ project, folders, onSave, onMoveToTrash }: ProjectEditDialogProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const close = () => setIsOpen(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} aria-label={t('project.edit')} title={t('project.edit')} className={iconButtonClass('ghost', 'sm')}>
        <Pencil />
      </button>

      <Modal isOpen={isOpen} onClose={close} labelledBy={titleId} className="w-[min(440px,calc(100vw-32px))] p-0">
        <ProjectSettingsForm
          titleId={titleId}
          title={t('project.editTitle')}
          initialSettings={{ name: project.name, folderId: project.folderId, isShared: project.shareToken !== null }}
          folders={folders}
          submitLabel={t('common.save')}
          middleAction={
            <button
              type="button"
              onClick={() => {
                close();
                onMoveToTrash();
              }}
              className={buttonClass('danger', 'lg')}
            >
              <Trash />
              {t('project.moveToTrash')}
            </button>
          }
          onSubmit={settings => {
            close();
            onSave(settings);
          }}
          onCancel={close}
        />
      </Modal>
    </>
  );
}
