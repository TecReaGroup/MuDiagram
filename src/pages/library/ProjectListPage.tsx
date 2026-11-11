import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLibraryOutlet } from '../../features/project-library/library-outlet';
import { selectProjects, VISIBILITY_TABS, type SortOrderId, type VisibilityTabId } from '../../features/project-library/library-view';
import { ProjectCard } from '../../features/project-library/ProjectCard';
import { SortMenu } from '../../features/project-library/SortMenu';

const STATUS_TEXT_CLASS = 'mt-16 text-center text-sm text-ink-muted';

/** All projects, or one folder's projects when the route carries a `folderId`. */
export function ProjectListPage() {
  const { folderId } = useParams();
  const { library, searchText } = useLibraryOutlet();
  const [visibilityId, setVisibilityId] = useState<VisibilityTabId>('all');
  const [sortId, setSortId] = useState<SortOrderId>('updated');

  const folder = folderId ? library.folders.find(candidate => candidate.id === folderId) : undefined;
  if (folderId && !folder) return <p className={STATUS_TEXT_CLASS}>文件夹不存在或已被删除。</p>;

  const scopedProjects = folder ? library.projects.filter(project => project.folderId === folder.id) : library.projects;
  const visibleProjects = selectProjects(scopedProjects, { visibilityId, sortId, searchText });

  return (
    <>
      <h1 className="mb-4 truncate text-lg font-semibold tracking-[-0.01em]">{folder?.name ?? '全部图表'}</h1>
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
                className={`h-7 rounded-md px-3.5 text-sm transition-[background-color,color,box-shadow] ${isActive ? 'bg-surface font-medium text-ink shadow-xs' : 'text-ink-muted hover:text-ink'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <SortMenu selectedId={sortId} onSelect={setSortId} />
      </div>

      {visibleProjects.length === 0 && (
        <p className={STATUS_TEXT_CLASS}>
          {scopedProjects.length === 0 ? '还没有图表，点击「新建图表」开始绘制。' : '没有符合条件的图表。'}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            folders={library.folders}
            onRename={(target, name) => void library.renameProject(target, name)}
            onMoveToFolder={(target, targetFolderId) => void library.moveProjectToFolder(target, targetFolderId)}
            onMoveToTrash={target => void library.moveProjectToTrash(target)}
          />
        ))}
      </div>
    </>
  );
}
