import { useLibraryOutlet } from '../../features/project-library/library-outlet';
import { matchesSearch } from '../../features/project-library/library-view';
import { TrashedProjectCard } from '../../features/project-library/TrashedProjectCard';

export function TrashPage() {
  const { library, searchText } = useLibraryOutlet();
  const visibleProjects = library.trashedProjects.filter(project => matchesSearch(project, searchText));

  return (
    <>
      <h1 className="text-lg font-semibold tracking-[-0.01em]">回收站</h1>
      <p className="mt-1 text-sm text-ink-muted">删除的图表会在这里保留一段时间，到期后自动彻底删除。</p>

      {visibleProjects.length === 0 && (
        <p className="mt-16 text-center text-sm text-ink-muted">
          {library.trashedProjects.length === 0 ? '回收站是空的。' : '没有符合条件的图表。'}
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
