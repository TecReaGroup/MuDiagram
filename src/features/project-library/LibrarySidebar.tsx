import { Clock, LayoutGrid, Plus } from 'lucide-react';
import type { Project } from '../../entities/project/project-api';
import { BrandMark } from '../../shared/ui/BrandMark';
import { PRIMARY_BUTTON_CLASS } from '../../shared/ui/control-class';
import { countProjectsInSection, LIBRARY_SECTIONS, type LibrarySectionId } from './library-view';

const SECTION_ICONS = { all: LayoutGrid, recent: Clock } satisfies Record<LibrarySectionId, unknown>;

type LibrarySidebarProps = {
  projects: Project[];
  activeSectionId: LibrarySectionId;
  isCreating: boolean;
  onSelectSection: (sectionId: LibrarySectionId) => void;
  onCreateProject: () => void;
};

export function LibrarySidebar({ projects, activeSectionId, isCreating, onSelectSection, onCreateProject }: LibrarySidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-4 md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <BrandMark />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">MuDiagram</span>
      </div>
      <button type="button" onClick={onCreateProject} disabled={isCreating} className={`${PRIMARY_BUTTON_CLASS} mt-5 h-10 w-full rounded-xl text-sm`}>
        <Plus className="size-4" strokeWidth={2} />
        新建项目
      </button>
      <nav className="mt-5 space-y-0.5">
        {LIBRARY_SECTIONS.map(section => {
          const Icon = SECTION_ICONS[section.id];
          const isActive = section.id === activeSectionId;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${isActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-interactive-hover hover:text-foreground'}`}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              <span className="flex-1 text-left">{section.label}</span>
              <span className="text-xs tabular-nums text-faint">{countProjectsInSection(projects, section.id)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
