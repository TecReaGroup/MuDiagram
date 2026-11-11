import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SAMPLE_PROJECTS } from '../../entities/project/sample-project';
import { PromptLauncher } from '../../features/ai-assistant/PromptLauncher';
import { LibrarySidebar } from '../../features/project-library/LibrarySidebar';
import { ProjectCard } from '../../features/project-library/ProjectCard';
import { BrandMark } from '../../shared/ui/BrandMark';
import { PRIMARY_BUTTON_CLASS } from '../../shared/ui/control-class';

const VISIBILITY_TABS = ['全部', '公开链接', '私有'] as const;
const SORT_ORDERS = ['最近修改', '最近创建', '名称'] as const;

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState<string>(VISIBILITY_TABS[0]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <LibrarySidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-wrap items-center gap-3">
            <div className="md:hidden">
              <BrandMark />
            </div>
            <h1 className="mr-auto text-[28px] font-semibold tracking-[-0.02em]">Library</h1>
            <Link to="/project/new" aria-label="新建项目" className={`${PRIMARY_BUTTON_CLASS} size-10 rounded-xl px-0 md:hidden`}>
              <Plus className="size-4" strokeWidth={2} />
            </Link>
            <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-card px-3 transition-[border-color,box-shadow] focus-within:border-foreground/20 focus-within:shadow-[0_0_0_4px_var(--accent)] sm:w-80">
              <Search className="size-4 shrink-0 text-faint" strokeWidth={1.75} />
              <input placeholder="搜索项目" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint" />
              <kbd className="hidden rounded-md border border-border px-1.5 font-sans text-[11px] text-faint sm:inline">Ctrl K</kbd>
            </label>
          </header>

          <div className="mt-6">
            <PromptLauncher />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" className="flex gap-0.5 rounded-xl bg-surface-2 p-1">
              {VISIBILITY_TABS.map(tab => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab)}
                    className={`h-8 rounded-lg px-3.5 text-[13px] transition-colors ${isActive ? 'bg-card font-medium text-foreground shadow-float' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
            <select aria-label="排序" className="h-10 rounded-xl border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-foreground/20">
              {SORT_ORDERS.map(order => <option key={order}>{order}</option>)}
            </select>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {SAMPLE_PROJECTS.map(project => <ProjectCard key={project.id} project={project} />)}
          </div>
        </div>
      </main>
    </div>
  );
}
