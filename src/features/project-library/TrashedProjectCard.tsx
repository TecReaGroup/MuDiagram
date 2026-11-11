import { RotateCcw, Trash } from 'lucide-react';
import type { TrashedProject } from '../../entities/project/project-api';
import { useI18n, type I18n } from '../../shared/i18n/language-context';
import { ConfirmDeleteButton } from '../../shared/ui/ConfirmDeleteButton';
import { iconButtonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';
import { ProjectPreview } from './ProjectPreview';

const DAY_MS = 24 * 60 * 60 * 1000;

type TrashedProjectCardProps = {
  project: TrashedProject;
  onRestore: (project: TrashedProject) => void;
  onDeletePermanently: (project: TrashedProject) => void;
};

function describePurgeTime(purgeAt: string, { language, t }: I18n): string {
  const remainingDays = Math.ceil((Date.parse(purgeAt) - Date.now()) / DAY_MS);
  if (remainingDays <= 0) return t('trash.purgeSoon');
  const when = new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(remainingDays, 'day');
  return t('trash.purgeIn', { when });
}

export function TrashedProjectCard({ project, onRestore, onDeletePermanently }: TrashedProjectCardProps) {
  const i18n = useI18n();
  const { t } = i18n;

  return (
    <article className={`${SURFACE_CARD_CLASS} group animate-fade-in p-1.5`}>
      <div className="dot-grid flex aspect-[27/14] items-center justify-center overflow-hidden rounded-lg opacity-60 grayscale">
        <ProjectPreview project={project} />
      </div>
      <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{project.name}</p>
          <time dateTime={project.purgeAt} className="mt-0.5 block text-xs text-ink-faint">{describePurgeTime(project.purgeAt, i18n)}</time>
        </div>
        <div className="flex gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100">
          <button type="button" onClick={() => onRestore(project)} aria-label={t('trash.restore')} title={t('trash.restore')} className={iconButtonClass('ghost', 'sm')}>
            <RotateCcw />
          </button>
          <ConfirmDeleteButton
            label={t('trash.deletePermanently')}
            title={t('trash.confirmDeleteTitle')}
            description={t('trash.confirmDeleteDescription', { name: project.name })}
            onConfirm={() => onDeletePermanently(project)}
            className={iconButtonClass('danger', 'sm')}
          >
            <Trash />
          </ConfirmDeleteButton>
        </div>
      </div>
    </article>
  );
}
