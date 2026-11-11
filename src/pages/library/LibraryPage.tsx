import { Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInitialPromptState, projectNameFromPrompt } from '../../features/ai-assistant/initial-prompt';
import { PromptLauncher } from '../../features/ai-assistant/PromptLauncher';
import { LibrarySidebar } from '../../features/project-library/LibrarySidebar';
import {
  selectProjects,
  SORT_ORDERS,
  VISIBILITY_TABS,
  type LibraryQuery,
  type SortOrderId,
} from '../../features/project-library/library-view';
import { ProjectCard } from '../../features/project-library/ProjectCard';
import { useProjectLibrary } from '../../features/project-library/use-project-library';
import { BrandMark } from '../../shared/ui/BrandMark';
import { PRIMARY_BUTTON_CLASS } from '../../shared/ui/control-class';

const UNTITLED_PROJECT_NAME = '未命名项目';
const SEARCH_SHORTCUT_LABEL = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K';

function useSearchShortcut() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);
  return searchInputRef;
}

export function LibraryPage() {
  const navigate = useNavigate();
  const { projects, failure, create, rename, remove } = useProjectLibrary();
  const [query, setQuery] = useState<LibraryQuery>({ sectionId: 'all', visibilityId: 'all', sortId: 'updated', searchText: '' });
  const [isCreating, setIsCreating] = useState(false);
  const searchInputRef = useSearchShortcut();

  const updateQuery = (change: Partial<LibraryQuery>) => setQuery(current => ({ ...current, ...change }));

  async function createAndOpen(name: string, routerState?: unknown) {
    setIsCreating(true);
    const project = await create(name);
    setIsCreating(false);
    if (project) navigate(`/project/${project.id}`, { state: routerState });
  }

  const visibleProjects = projects ? selectProjects(projects, query) : [];

  return (
    <div className="flex min-h-screen bg-canvas">
      <LibrarySidebar
        projects={projects ?? []}
        activeSectionId={query.sectionId}
        isCreating={isCreating}
        onSelectSection={sectionId => updateQuery({ sectionId })}
        onCreateProject={() => void createAndOpen(UNTITLED_PROJECT_NAME)}
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 md:hidden">
              <BrandMark />
            </div>
            <h1 className="mr-auto text-[28px] font-semibold tracking-[-0.02em]">Library</h1>
            <button
              type="button"
              onClick={() => void createAndOpen(UNTITLED_PROJECT_NAME)}
              disabled={isCreating}
              aria-label="新建项目"
              className={`${PRIMARY_BUTTON_CLASS} size-10 rounded-xl px-0 md:hidden`}
            >
              <Plus className="size-4" strokeWidth={2} />
            </button>
            <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 transition-[border-color,box-shadow] focus-within:border-foreground/20 focus-within:shadow-[0_0_0_4px_var(--accent)] sm:w-80">
              <Search className="size-4 shrink-0 text-faint" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                value={query.searchText}
                onChange={event => updateQuery({ searchText: event.target.value })}
                placeholder="搜索项目"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
              />
              <kbd className="hidden rounded-md border border-border px-1.5 font-sans text-[11px] text-faint sm:inline">{SEARCH_SHORTCUT_LABEL}</kbd>
            </label>
          </header>

          <div className="mt-6">
            <PromptLauncher
              isLaunching={isCreating}
              onLaunch={prompt => void createAndOpen(projectNameFromPrompt(prompt), createInitialPromptState(prompt))}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" className="flex gap-0.5 rounded-xl bg-surface-2 p-1">
              {VISIBILITY_TABS.map(tab => {
                const isActive = tab.id === query.visibilityId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => updateQuery({ visibilityId: tab.id })}
                    className={`h-8 rounded-lg px-3.5 text-[13px] transition-colors ${isActive ? 'bg-card font-medium text-foreground shadow-float' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <select
              value={query.sortId}
              onChange={event => updateQuery({ sortId: event.target.value as SortOrderId })}
              aria-label="排序"
              className="h-10 rounded-xl border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-foreground/20"
            >
              {SORT_ORDERS.map(order => <option key={order.id} value={order.id}>{order.label}</option>)}
            </select>
          </div>

          {failure && <p className="mt-6 rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-[13px] text-destructive">{failure}</p>}
          {projects === null && !failure && <p className="mt-10 text-center text-[13px] text-muted-foreground">加载中…</p>}
          {projects !== null && visibleProjects.length === 0 && (
            <p className="mt-16 text-center text-[13px] text-muted-foreground">
              {projects.length === 0 ? '还没有项目，用上面的输入框描述一个系统，或者新建一个空白项目。' : '没有符合条件的项目。'}
            </p>
          )}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map(project => (
              <ProjectCard key={project.id} project={project} onRename={(target, name) => void rename(target, name)} onDelete={target => void remove(target)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
