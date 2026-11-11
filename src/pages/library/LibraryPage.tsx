import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_PROJECTS } from '../../entities/project/sample-project';
import { LibrarySidebar } from '../../features/project-library/LibrarySidebar';
import { ProjectCard } from '../../features/project-library/ProjectCard';
import { SortMenu } from '../../features/project-library/SortMenu';
import { SiteSettingsButton } from '../../features/site-settings/SiteSettingsButton';
import { BrandMark } from '../../shared/ui/BrandMark';
import { FIELD_FOCUS_CLASS, iconButtonClass } from '../../shared/ui/control-class';

const VISIBILITY_TABS = ['全部', '公开', '私有'] as const;

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState<string>(VISIBILITY_TABS[0]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <LibrarySidebar />
      <main className="min-w-0 flex-1 md:py-2 md:pr-2">
        <div className="min-h-full bg-surface md:min-h-[calc(100vh-16px)] md:rounded-xl md:border md:border-line md:shadow-xs">
          <header className="grid h-14 grid-cols-[1fr_minmax(0,36rem)_1fr] items-center gap-3 px-4 sm:px-6">
            <Link to="/" className="justify-self-start md:invisible" aria-label="MuDiagram">
              <BrandMark />
            </Link>
            <label className={`flex h-10 w-full items-center gap-2.5 rounded-xl border border-line bg-sunken/60 px-3 focus-within:bg-surface ${FIELD_FOCUS_CLASS}`}>
              <Search className="size-4 shrink-0 text-ink-faint" />
              <input placeholder="搜索图表" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint" />
            </label>
            <div className="flex items-center justify-self-end gap-1.5">
              <Link to="/project/new" aria-label="新建图表" className={`${iconButtonClass('primary', 'lg')} md:hidden`}>
                <Plus />
              </Link>
              <SiteSettingsButton />
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-3">
              <div role="tablist" className="flex h-8 items-center rounded-lg bg-sunken p-0.5">
                {VISIBILITY_TABS.map(tab => {
                  const isActive = tab === activeTab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab)}
                      className={`h-7 rounded-md px-3.5 text-sm transition-[background-color,color,box-shadow] ${isActive ? 'bg-surface font-medium text-ink shadow-xs' : 'text-ink-muted hover:text-ink'}`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
              <SortMenu />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SAMPLE_PROJECTS.map(project => <ProjectCard key={project.id} project={project} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
