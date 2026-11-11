import { RotateCcw, Trash } from 'lucide-react';
import type { TrashedProject } from '../../entities/project/project-api';
import { iconButtonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';
import { ProjectPreview } from './ProjectPreview';

const DAY_MS = 24 * 60 * 60 * 1000;

type TrashedProjectCardProps = {
  project: TrashedProject;
  onRestore: (project: TrashedProject) => void;
  onDeletePermanently: (project: TrashedProject) => void;
};

function describePurgeTime(purgeAt: string): string {
  const remainingDays = Math.ceil((Date.parse(purgeAt) - Date.now()) / DAY_MS);
  return remainingDays > 0 ? `${remainingDays} 天后彻底删除` : '即将彻底删除';
}

export function TrashedProjectCard({ project, onRestore, onDeletePermanently }: TrashedProjectCardProps) {
  function confirmDelete() {
    if (window.confirm(`彻底删除图表「${project.name}」？此操作无法撤销。`)) onDeletePermanently(project);
  }

  return (
    <article className={`${SURFACE_CARD_CLASS} group animate-fade-in p-1.5`}>
      <div className="dot-grid flex aspect-[27/14] items-center justify-center overflow-hidden rounded-lg opacity-60 grayscale">
        <ProjectPreview project={project} />
      </div>
      <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{project.name}</p>
          <time dateTime={project.purgeAt} className="mt-0.5 block text-xs text-ink-faint">{describePurgeTime(project.purgeAt)}</time>
        </div>
        <div className="flex gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" onClick={() => onRestore(project)} aria-label="恢复" title="恢复" className={iconButtonClass('ghost', 'sm')}>
            <RotateCcw />
          </button>
          <button type="button" onClick={confirmDelete} aria-label="彻底删除" title="彻底删除" className={iconButtonClass('danger', 'sm')}>
            <Trash />
          </button>
        </div>
      </div>
    </article>
  );
}
