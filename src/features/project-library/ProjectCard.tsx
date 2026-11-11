import { Globe, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Folder } from '../../entities/folder/folder-api';
import type { Project } from '../../entities/project/project-api';
import { useI18n } from '../../shared/i18n/language-context';
import { formatRelativeTime } from '../../shared/lib/relative-time';
import { HOVER_REVEAL_CLASS, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';
import { ProjectEditDialog } from './ProjectEditDialog';
import { ProjectPreview } from './ProjectPreview';
import type { ProjectSettings } from './use-project-library';

type ProjectCardProps = {
  project: Project;
  folders: Folder[];
  onEdit: (project: Project, settings: ProjectSettings) => void;
  onMoveToTrash: (project: Project) => void;
};

export function ProjectCard({ project, folders, onEdit, onMoveToTrash }: ProjectCardProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const isShared = project.shareToken !== null;
  const VisibilityIcon = isShared ? Globe : Lock;

  return (
    <article className={`${SURFACE_CARD_CLASS} group relative animate-fade-in p-1.5 transition-[box-shadow,border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card`}>
      <Link to={`/project/${project.id}`} className="dot-grid flex aspect-[27/14] items-center justify-center overflow-hidden rounded-lg">
        <ProjectPreview project={project} />
      </Link>
      <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
        <div className="min-w-0 flex-1">
          <Link to={`/project/${project.id}`} className="block truncate text-sm font-medium text-ink after:absolute after:inset-0 after:content-['']">
            {project.name}
          </Link>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
            <VisibilityIcon className={`size-3 ${isShared ? 'text-success' : ''}`} />
            <span>{t(isShared ? 'project.public' : 'project.private')}</span>
            <span aria-hidden>·</span>
            <time dateTime={project.updatedAt}>{t('project.edited', { time: formatRelativeTime(project.updatedAt, i18n) })}</time>
          </div>
        </div>
        <div className={`${HOVER_REVEAL_CLASS} relative z-10`}>
          <ProjectEditDialog
            project={project}
            folders={folders}
            onSave={settings => onEdit(project, settings)}
            onMoveToTrash={() => onMoveToTrash(project)}
          />
        </div>
      </div>
    </article>
  );
}
