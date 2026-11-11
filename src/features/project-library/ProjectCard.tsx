import { Globe, Lock, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Folder } from '../../entities/folder/folder-api';
import type { Project } from '../../entities/project/project-api';
import { formatRelativeTime } from '../../shared/lib/relative-time';
import { iconButtonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';
import { InlineNameInput } from '../../shared/ui/InlineNameInput';
import { MoveToFolderMenu } from './MoveToFolderMenu';
import { ProjectPreview } from './ProjectPreview';

type ProjectCardProps = {
  project: Project;
  folders: Folder[];
  onRename: (project: Project, name: string) => void;
  onMoveToFolder: (project: Project, folderId: string | null) => void;
  onMoveToTrash: (project: Project) => void;
};

export function ProjectCard({ project, folders, onRename, onMoveToFolder, onMoveToTrash }: ProjectCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const isShared = project.shareToken !== null;
  const VisibilityIcon = isShared ? Globe : Lock;

  return (
    // focus-within lifts the card so its open folder menu is not covered by the next card.
    <article className={`${SURFACE_CARD_CLASS} group relative animate-fade-in p-1.5 transition-[box-shadow,border-color,translate] duration-200 focus-within:z-10 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card`}>
      <Link to={`/project/${project.id}`} className="dot-grid flex aspect-[27/14] items-center justify-center overflow-hidden rounded-lg">
        <ProjectPreview project={project} />
      </Link>
      <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <InlineNameInput
              initialName={project.name}
              label="图表名称"
              onSubmit={name => onRename(project, name)}
              onFinish={() => setIsRenaming(false)}
              className="relative z-10 -mx-1.5 h-6 w-[calc(100%+0.75rem)] font-medium"
            />
          ) : (
            <Link to={`/project/${project.id}`} className="block truncate text-sm font-medium text-ink after:absolute after:inset-0 after:content-['']">
              {project.name}
            </Link>
          )}
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <VisibilityIcon className={`size-3 ${isShared ? 'text-success' : ''}`} />
            <span>{isShared ? '公开' : '私有'}</span>
            <span aria-hidden>·</span>
            <time dateTime={project.updatedAt}>{formatRelativeTime(project.updatedAt)}</time>
          </div>
        </div>
        <div className="relative z-10 flex gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" onClick={() => setIsRenaming(true)} aria-label="重命名" title="重命名" className={iconButtonClass('ghost', 'sm')}>
            <Pencil />
          </button>
          <MoveToFolderMenu currentFolderId={project.folderId} folders={folders} onMove={folderId => onMoveToFolder(project, folderId)} />
          <button type="button" onClick={() => onMoveToTrash(project)} aria-label="移到回收站" title="移到回收站" className={iconButtonClass('danger', 'sm')}>
            <Trash />
          </button>
        </div>
      </div>
    </article>
  );
}
