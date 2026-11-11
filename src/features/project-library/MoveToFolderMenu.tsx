import { FolderInput } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { Folder } from '../../entities/folder/folder-api';
import { iconButtonClass, MENU_ITEM_CLASS, MENU_PANEL_CLASS } from '../../shared/ui/control-class';
import { useDismiss } from '../../shared/ui/use-dismiss';

type MoveToFolderMenuProps = {
  currentFolderId: string | null;
  folders: Folder[];
  onMove: (folderId: string | null) => void;
};

const MENU_TARGET_NONE = { id: null, name: '不放入文件夹' } as const;

export function MoveToFolderMenu({ currentFolderId, folders, onMove }: MoveToFolderMenuProps) {
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
        aria-label="移动到文件夹"
        title="移动到文件夹"
        className={iconButtonClass('ghost', 'sm')}
      >
        <FolderInput />
      </button>
      {isOpen && (
        <div role="menu" aria-label="移动到文件夹" className={`${MENU_PANEL_CLASS} absolute top-8 right-0 w-44 origin-top-right`}>
          {[MENU_TARGET_NONE, ...folders].map(target => (
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
