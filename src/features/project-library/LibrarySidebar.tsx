import { ChevronRight, Folder as FolderIcon, LayoutGrid, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useMatch, useNavigate } from 'react-router-dom';
import type { Folder } from '../../entities/folder/folder-api';
import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';
import { buttonClass, FOCUS_RING, iconButtonClass, NAV_ITEM_CLASS, NAV_ITEM_COUNT_CLASS } from '../../shared/ui/control-class';
import { InlineNameInput } from '../../shared/ui/InlineNameInput';
import { NavItemList } from '../../shared/ui/NavItemList';
import { FolderNavItem } from './FolderNavItem';
import type { ProjectLibrary } from './use-project-library';

const MAX_VISIBLE_FOLDERS = 5;

type LibrarySidebarProps = {
  library: ProjectLibrary;
  isCreatingProject: boolean;
  onCreateProject: () => void;
};

export function LibrarySidebar({ library, isCreatingProject, onCreateProject }: LibrarySidebarProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const viewedFolderId = useMatch('/folder/:folderId')?.params.folderId;
  const [isFolderListOpen, setIsFolderListOpen] = useState(true);
  const [isNamingNewFolder, setIsNamingNewFolder] = useState(false);

  const libraryLinks = [
    { path: '/', label: t('library.allProjects'), count: library.projects.length, Icon: LayoutGrid },
    { path: '/trash', label: t('library.trash'), count: library.trashedProjects.length, Icon: Trash },
  ];

  function startNewFolder() {
    setIsFolderListOpen(true);
    setIsNamingNewFolder(true);
  }

  async function deleteFolder(folder: Folder) {
    await library.deleteFolder(folder);
    if (viewedFolderId === folder.id) navigate('/');
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col px-4 pt-2 pb-8 md:flex">
      <Link to="/" className="flex h-14 items-center gap-2.5 px-1">
        <BrandMark className="size-8" />
        <span className="text-base font-semibold tracking-[-0.02em]">MuDiagram</span>
      </Link>
      <nav className="mt-4 space-y-1">
        {libraryLinks.map(({ path, label, count, Icon }) => (
          <NavLink key={path} to={path} end className={NAV_ITEM_CLASS}>
            <Icon />
            {label}
            {count > 0 && <span className={NAV_ITEM_COUNT_CLASS}>{count}</span>}
          </NavLink>
        ))}
      </nav>
      <section className="mt-7 min-h-0 overflow-y-auto">
        <div className="flex h-9 items-center justify-between pr-0.5">
          <h2 className="flex-1">
            <button
              type="button"
              aria-expanded={isFolderListOpen}
              aria-controls="folder-list"
              onClick={() => setIsFolderListOpen(open => !open)}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-ink-muted transition-colors duration-150 hover:text-ink ${FOCUS_RING}`}
            >
              <ChevronRight className={`size-4 shrink-0 transition-transform duration-200 ${isFolderListOpen ? 'rotate-90' : ''}`} />
              {t('folder.list')}
            </button>
          </h2>
          <button type="button" onClick={startNewFolder} aria-label={t('folder.new')} title={t('folder.new')} className={iconButtonClass()}>
            <Plus />
          </button>
        </div>
        <NavItemList id="folder-list" hidden={!isFolderListOpen} maxVisibleItems={MAX_VISIBLE_FOLDERS} className="mt-1">
          {library.folders.map(folder => (
            <FolderNavItem
              key={folder.id}
              folder={folder}
              projectCount={library.projects.filter(project => project.folderId === folder.id).length}
              onRename={(target, name) => void library.renameFolder(target, name)}
              onDelete={target => void deleteFolder(target)}
            />
          ))}
          {isNamingNewFolder && (
            <div className="flex h-9 items-center gap-2.5 px-3">
              <FolderIcon className="size-4 shrink-0 text-ink-muted" />
              <InlineNameInput
                initialName=""
                label={t('folder.newName')}
                onSubmit={name => void library.createFolder(name)}
                onFinish={() => setIsNamingNewFolder(false)}
                className="-ml-1.5 flex-1"
              />
            </div>
          )}
          {library.folders.length === 0 && !isNamingNewFolder && (
            <p className="px-3 py-1.5 text-xs text-ink-faint">{t('folder.empty')}</p>
          )}
        </NavItemList>
      </section>
      <button type="button" onClick={onCreateProject} disabled={isCreatingProject} className={`${buttonClass('primary', 'xl')} mt-auto w-full`}>
        <Plus />
        {t('library.newProject')}
      </button>
    </aside>
  );
}
