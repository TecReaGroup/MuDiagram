import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom';
import type { LibraryOutletContext } from '../../features/project-library/library-outlet';
import { LibrarySidebar } from '../../features/project-library/LibrarySidebar';
import { NewProjectDialog } from '../../features/project-library/NewProjectDialog';
import { useProjectLibrary, type ProjectSettings } from '../../features/project-library/use-project-library';
import { SiteSettingsButton } from '../../features/site-settings/SiteSettingsButton';
import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';
import { FIELD_FOCUS_CLASS, iconButtonClass } from '../../shared/ui/control-class';
import { PAGE_STATUS_CLASS } from '../../shared/ui/text-class';

/** Shell shared by all projects, a folder and the trash: sidebar, search, and the library state. */
export function LibraryLayout() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const viewedFolderId = useMatch('/folder/:folderId')?.params.folderId ?? null;
  const library = useProjectLibrary();
  const [searchText, setSearchText] = useState('');
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  async function createAndOpenProject(settings: ProjectSettings) {
    setIsCreatingProject(true);
    const project = await library.createProject(settings);
    setIsCreatingProject(false);
    if (project) navigate(`/project/${project.id}`);
  }

  const openNewProjectDialog = () => setIsNewProjectDialogOpen(true);

  const outletContext: LibraryOutletContext = { library, searchText };

  return (
    <div className="flex min-h-screen bg-canvas">
      <LibrarySidebar library={library} isCreatingProject={isCreatingProject} onCreateProject={openNewProjectDialog} />
      {/* A project created while viewing a folder defaults to that folder. */}
      <NewProjectDialog
        isOpen={isNewProjectDialogOpen}
        folders={library.folders}
        initialFolderId={viewedFolderId}
        onCreate={settings => void createAndOpenProject(settings)}
        onClose={() => setIsNewProjectDialogOpen(false)}
      />
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
                onClick={openNewProjectDialog}
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
            {library.isLoading ? <p className={PAGE_STATUS_CLASS}>{t('common.loading')}</p> : <Outlet context={outletContext} />}
          </div>
        </div>
      </main>
    </div>
  );
}
