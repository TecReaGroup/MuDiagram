import { ChevronRight, Folder, LayoutGrid, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SAMPLE_FOLDERS } from '../../entities/folder/sample-folder';
import { SAMPLE_PROJECTS } from '../../entities/project/sample-project';
import { BrandMark } from '../../shared/ui/BrandMark';
import { buttonClass, FOCUS_RING, iconButtonClass, NAV_ITEM_CLASS, NAV_ITEM_COUNT_CLASS } from '../../shared/ui/control-class';

const LIBRARY_FOLDERS = [
  { path: '/', label: '全部图表', count: SAMPLE_PROJECTS.length, Icon: LayoutGrid },
  { path: '/trash', label: '回收站', count: 0, Icon: Trash },
] as const;

export function LibrarySidebar() {
  const [isFolderListOpen, setIsFolderListOpen] = useState(true);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col px-4 pt-2 pb-8 md:flex">
      <Link to="/" className="flex h-14 items-center gap-2.5 px-1">
        <BrandMark className="size-8" />
        <span className="text-base font-semibold tracking-[-0.02em]">MuDiagram</span>
      </Link>
      <nav className="mt-4 space-y-1">
        {LIBRARY_FOLDERS.map(({ path, label, count, Icon }) => (
          <NavLink key={path} to={path} end className={NAV_ITEM_CLASS}>
            <Icon />
            {label}
            {count > 0 && <span className={NAV_ITEM_COUNT_CLASS}>{count}</span>}
          </NavLink>
        ))}
      </nav>
      <section className="mt-7">
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
              文件夹
            </button>
          </h2>
          <button type="button" aria-label="新建文件夹" title="新建文件夹" className={iconButtonClass()}>
            <Plus />
          </button>
        </div>
        <nav id="folder-list" hidden={!isFolderListOpen} className="mt-1 space-y-0.5">
          {SAMPLE_FOLDERS.map(folder => (
            <NavLink key={folder.id} to={`/folder/${folder.id}`} className={NAV_ITEM_CLASS}>
              <Folder />
              <span className="truncate">{folder.name}</span>
              <span className={NAV_ITEM_COUNT_CLASS}>{folder.diagramCount}</span>
            </NavLink>
          ))}
        </nav>
      </section>
      <Link to="/project/new" className={`${buttonClass('primary', 'xl')} mt-auto w-full`}>
        <Plus />
        新建图表
      </Link>
    </aside>
  );
}
