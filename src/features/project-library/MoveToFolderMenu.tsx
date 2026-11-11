import { FolderInput } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { Folder } from '../../entities/folder/folder-api';
import { useI18n } from '../../shared/i18n/language-context';
import { iconButtonClass, MENU_ITEM_CLASS, MENU_PANEL_CLASS } from '../../shared/ui/control-class';
import { useDismiss } from '../../shared/ui/use-dismiss';

type MoveToFolderMenuProps = {
  currentFolderId: string | null;
  folders: Folder[];
  onMove: (folderId: string | null) => void;
};

export function MoveToFolderMenu({ currentFolderId, folders, onMove }: MoveToFolderMenuProps) {
  const { t } = useI18n();
  const menuTargetNone = { id: null, name: t('folder.none') };
  const [isOpen, setIsOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(menuRootRef, isOpen, close);

  const moveTo = (folderId: string | null) => {
    close();
    if (folderId !== currentFolderId) onMove(folderId);
  };

  return (
    <div ref={menuRootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('folder.moveTo')}
        title={t('folder.moveTo')}
        className={iconButtonClass('ghost', 'sm')}
      >
        <FolderInput />
      </button>
      {isOpen && (
        <div role="menu" aria-label={t('folder.moveTo')} className={`${MENU_PANEL_CLASS} absolute top-8 right-0 w-44 origin-top-right`}>
          {[menuTargetNone, ...folders].map(target => (
            <button
              key={target.id ?? 'none'}
              type="button"
              role="menuitemradio"
              aria-checked={target.id === currentFolderId}
              onClick={() => moveTo(target.id)}
              className={`${MENU_ITEM_CLASS} text-left`}
            >
              {target.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
