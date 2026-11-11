import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProjectSummary } from '../../entities/project/sample-project';

const CARD_ACTION_CLASS = 'inline-flex size-7 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-float transition-colors hover:text-foreground';

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <article className="group relative animate-fade-in overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-200 hover:shadow-float">
      <Link
        to={`/project/${project.id}`}
        className="flex h-44 items-center justify-center border-b border-border-subtle bg-surface-1 bg-[radial-gradient(var(--input)_1px,transparent_1px)] bg-size-[14px_14px]"
      >
        <span className="text-xs text-faint">图表预览</span>
      </Link>
      <div className="absolute top-2.5 right-2.5 flex gap-1 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <button type="button" aria-label="重命名" title="重命名" className={CARD_ACTION_CLASS}>
          <Pencil className="size-3.5" strokeWidth={1.75} />
        </button>
        <button type="button" aria-label="删除" title="删除" className={`${CARD_ACTION_CLASS} hover:text-destructive`}>
          <Trash2 className="size-3.5" strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-3.5">
        <div className="min-w-0">
          <Link to={`/project/${project.id}`} className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            {project.name}
          </Link>
          <span className="mt-0.5 block text-xs text-faint">{project.updatedLabel}</span>
        </div>
        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${project.isShared ? 'bg-success-muted text-success' : 'bg-muted text-muted-foreground'}`}>
          {project.isShared ? '公开' : '私有'}
        </span>
      </div>
    </article>
  );
}
