import { useId } from 'react';
import type { Folder } from '../../entities/folder/folder-api';
import { useI18n } from '../../shared/i18n/language-context';
import { Modal } from '../../shared/ui/Modal';
import { ProjectSettingsForm } from './ProjectSettingsForm';
import type { ProjectSettings } from './use-project-library';

type NewProjectDialogProps = {
  isOpen: boolean;
  folders: Folder[];
  initialFolderId: string | null;
  onCreate: (settings: ProjectSettings) => void;
  onClose: () => void;
};

export function NewProjectDialog({ isOpen, folders, initialFolderId, onCreate, onClose }: NewProjectDialogProps) {
  const { t } = useI18n();
  const titleId = useId();

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={titleId} className="w-[min(440px,calc(100vw-32px))] p-0">
      <ProjectSettingsForm
        titleId={titleId}
        title={t('library.newProject')}
        initialSettings={{ name: t('project.untitled'), folderId: initialFolderId, isShared: false }}
        folders={folders}
        submitLabel={t('common.create')}
        onSubmit={settings => {
          onClose();
          onCreate(settings);
        }}
        onCancel={onClose}
      />
    </Modal>
  );
}
