import { Globe, Lock, Pencil, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProjectSummary } from '../../entities/project/sample-project';
import { iconButtonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';
import { DiagramSketch } from './DiagramSketch';

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const VisibilityIcon = project.isShared ? Globe : Lock;

  return (
    <article className={`${SURFACE_CARD_CLASS} group relative animate-fade-in p-1.5 transition-[box-shadow,border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card`}>
      <Link to={`/project/${project.id}`} className="dot-grid block aspect-[27/14] overflow-hidden rounded-lg">
        <DiagramSketch seed={project.id} />
      </Link>
      <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
        <div className="min-w-0 flex-1">
          <Link to={`/project/${project.id}`} className="block truncate text-sm font-medium text-ink after:absolute after:inset-0 after:content-['']">
            {project.name}
          </Link>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <VisibilityIcon className={`size-3 ${project.isShared ? 'text-success' : ''}`} />
            <span>{project.isShared ? '公开' : '私有'}</span>
            <span aria-hidden>·</span>
            <span>{project.updatedLabel}</span>
          </div>
        </div>
        <div className="relative z-10 flex gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" aria-label="重命名" title="重命名" className={iconButtonClass('ghost', 'sm')}>
            <Pencil />
          </button>
          <button type="button" aria-label="删除" title="删除" className={iconButtonClass('danger', 'sm')}>
            <Trash />
          </button>
        </div>
      </div>
    </article>
  );
}
