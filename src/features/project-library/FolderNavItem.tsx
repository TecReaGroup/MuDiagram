import { Folder as FolderIcon, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import type { Folder } from '../../entities/folder/folder-api';
import { useI18n } from '../../shared/i18n/language-context';
import { iconButtonClass, NAV_ITEM_CLASS, NAV_ITEM_COUNT_CLASS } from '../../shared/ui/control-class';
import { InlineNameInput } from '../../shared/ui/InlineNameInput';

type FolderNavItemProps = {
  folder: Folder;
  projectCount: number;
  onRename: (folder: Folder, name: string) => void;
  onDelete: (folder: Folder) => void;
};

export function FolderNavItem({ folder, projectCount, onRename, onDelete }: FolderNavItemProps) {
  const { t } = useI18n();
  const [isRenaming, setIsRenaming] = useState(false);
  const path = `/folder/${folder.id}`;
  // The actions sit beside the link (buttons cannot nest inside <a>), so they need the active state too.
  const isActive = useMatch(path) !== null;
  const actionTone = isActive ? 'inverse' : 'ghost';

  if (isRenaming) {
    return (
      <div className="flex h-9 items-center gap-2.5 px-3">
        <FolderIcon className="size-4 shrink-0 text-ink-muted" />
        <InlineNameInput
          initialName={folder.name}
          label={t('folder.name')}
          onSubmit={name => onRename(folder, name)}
          onFinish={() => setIsRenaming(false)}
          className="-ml-1.5 flex-1"
        />
      </div>
    );
  }

  function confirmDelete() {
    if (window.confirm(t('folder.confirmDelete', { name: folder.name }))) onDelete(folder);
  }

  return (
    <div className="group/folder relative">
      <NavLink to={path} className={NAV_ITEM_CLASS}>
        <FolderIcon />
        <span className="truncate pr-14">{folder.name}</span>
        <span className={`${NAV_ITEM_COUNT_CLASS} group-hover/folder:invisible group-focus-within/folder:invisible`}>{projectCount}</span>
      </NavLink>
      <div className="absolute inset-y-0 right-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/folder:opacity-100 focus-within:opacity-100">
        <button type="button" onClick={() => setIsRenaming(true)} aria-label={t('folder.rename')} title={t('common.rename')} className={iconButtonClass(actionTone, 'sm')}>
          <Pencil />
        </button>
        <button type="button" onClick={confirmDelete} aria-label={t('folder.delete')} title={t('folder.deleteShort')} className={iconButtonClass(isActive ? 'inverse' : 'danger', 'sm')}>
          <Trash />
        </button>
      </div>
    </div>
  );
}
