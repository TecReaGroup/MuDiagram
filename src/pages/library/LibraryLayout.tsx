import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom';
import type { LibraryOutletContext } from '../../features/project-library/library-outlet';
import { LibrarySidebar } from '../../features/project-library/LibrarySidebar';
import { useProjectLibrary } from '../../features/project-library/use-project-library';
import { SiteSettingsButton } from '../../features/site-settings/SiteSettingsButton';
import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';
import { FIELD_FOCUS_CLASS, iconButtonClass } from '../../shared/ui/control-class';

/** Shell shared by all projects, a folder and the trash: sidebar, search, and the library state. */
export function LibraryLayout() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const viewedFolderId = useMatch('/folder/:folderId')?.params.folderId ?? null;
  const library = useProjectLibrary();
  const [searchText, setSearchText] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // A project created while viewing a folder goes straight into that folder.
  async function createAndOpenProject() {
    setIsCreatingProject(true);
    const project = await library.createProject(t('project.untitled'), viewedFolderId);
    setIsCreatingProject(false);
    if (project) navigate(`/project/${project.id}`);
  }

  const outletContext: LibraryOutletContext = { library, searchText };

  return (
    <div className="flex min-h-screen bg-canvas">
      <LibrarySidebar library={library} isCreatingProject={isCreatingProject} onCreateProject={() => void createAndOpenProject()} />
      <main className="min-w-0 flex-1 md:py-2 md:pr-2">
        <div className="min-h-full bg-surface md:min-h-[calc(100vh-16px)] md:rounded-xl md:border md:border-line md:shadow-xs">
          <header className="grid h-14 grid-cols-[1fr_minmax(0,36rem)_1fr] items-center gap-3 px-4 sm:px-6">
            <Link to="/" className="justify-self-start md:invisible" aria-label="MuDiagram">
              <BrandMark />
            </Link>
            <label className={`flex h-10 w-full items-center gap-2.5 rounded-xl border border-line bg-sunken/60 px-3 focus-within:bg-surface ${FIELD_FOCUS_CLASS}`}>
              <Search className="size-4 shrink-0 text-ink-faint" />
              <input
                type="search"
                value={searchText}
                onChange={event => setSearchText(event.target.value)}
                placeholder={t('library.search')}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
              />
            </label>
            <div className="flex items-center justify-self-end gap-1.5">
              <button
                type="button"
                onClick={() => void createAndOpenProject()}
                disabled={isCreatingProject}
                aria-label={t('library.newProject')}
                className={`${iconButtonClass('primary', 'lg')} md:hidden`}
              >
                <Plus />
              </button>
              <SiteSettingsButton />
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:px-10">
            {library.failure && (
              <p role="alert" className="mb-5 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-sm text-danger">{library.failure}</p>
            )}
            {library.isLoading ? <p className="mt-16 text-center text-sm text-ink-muted">{t('common.loading')}</p> : <Outlet context={outletContext} />}
          </div>
        </div>
      </main>
    </div>
  );
}
