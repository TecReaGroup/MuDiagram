import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLibraryOutlet } from '../../features/project-library/library-outlet';
import { selectProjects, VISIBILITY_TABS, type SortOrderId, type VisibilityTabId } from '../../features/project-library/library-view';
import { ProjectCard } from '../../features/project-library/ProjectCard';
import { SortMenu } from '../../features/project-library/SortMenu';
import { useI18n } from '../../shared/i18n/language-context';
import { FOCUS_RING } from '../../shared/ui/control-class';
import { PAGE_STATUS_CLASS, PAGE_TITLE_CLASS } from '../../shared/ui/text-class';

/** All projects, or one folder's projects when the route carries a `folderId`. */
export function ProjectListPage() {
  const { t } = useI18n();
  const { folderId } = useParams();
  const { library, searchText } = useLibraryOutlet();
  const [visibilityId, setVisibilityId] = useState<VisibilityTabId>('all');
  const [sortId, setSortId] = useState<SortOrderId>('updated');

  const folder = folderId ? library.folders.find(candidate => candidate.id === folderId) : undefined;
  if (folderId && !folder) return <p className={PAGE_STATUS_CLASS}>{t('library.folderMissing')}</p>;

  const scopedProjects = folder ? library.projects.filter(project => project.folderId === folder.id) : library.projects;
  const visibleProjects = selectProjects(scopedProjects, { visibilityId, sortId, searchText });

  return (
    <>
      <h1 className={`${PAGE_TITLE_CLASS} mb-4 truncate`}>{folder?.name ?? t('library.allProjects')}</h1>
      <div className="flex items-center justify-between gap-3">
        <div role="tablist" className="flex h-8 items-center rounded-lg bg-sunken p-0.5">
          {VISIBILITY_TABS.map(tab => {
            const isActive = tab.id === visibilityId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setVisibilityId(tab.id)}
                className={`h-7 rounded-md px-3.5 text-sm transition-[background-color,color,box-shadow] ${FOCUS_RING} ${isActive ? 'bg-surface font-medium text-ink shadow-xs' : 'text-ink-muted hover:text-ink'}`}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
        <SortMenu selectedId={sortId} onSelect={setSortId} />
      </div>

      {visibleProjects.length === 0 && (
        <p className={PAGE_STATUS_CLASS}>
          {t(scopedProjects.length === 0 ? 'library.empty' : 'common.noMatchingProject')}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            folders={library.folders}
            onEdit={(target, settings) => void library.editProject(target, settings)}
            onMoveToTrash={target => void library.moveProjectToTrash(target)}
          />
        ))}
      </div>
    </>
  );
}
