import { useLibraryOutlet } from '../../features/project-library/library-outlet';
import { matchesSearch } from '../../features/project-library/library-view';
import { TrashedProjectCard } from '../../features/project-library/TrashedProjectCard';
import { useI18n } from '../../shared/i18n/language-context';

export function TrashPage() {
  const { t } = useI18n();
  const { library, searchText } = useLibraryOutlet();
  const visibleProjects = library.trashedProjects.filter(project => matchesSearch(project, searchText));

  return (
    <>
      <h1 className="text-lg font-semibold tracking-[-0.01em]">{t('library.trash')}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t('trash.description')}</p>

      {visibleProjects.length === 0 && (
        <p className="mt-16 text-center text-sm text-ink-muted">
          {t(library.trashedProjects.length === 0 ? 'trash.empty' : 'common.noMatchingProject')}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map(project => (
          <TrashedProjectCard
            key={project.id}
            project={project}
            onRestore={target => void library.restoreProject(target)}
            onDeletePermanently={target => void library.deleteProjectPermanently(target)}
          />
        ))}
      </div>
    </>
  );
}
