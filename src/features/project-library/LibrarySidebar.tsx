import { Clock, LayoutGrid, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../../shared/ui/BrandMark';
import { PRIMARY_BUTTON_CLASS } from '../../shared/ui/control-class';

const LIBRARY_SECTIONS = [
  { id: 'all', label: '全部项目', count: 6, Icon: LayoutGrid },
  { id: 'recent', label: '最近编辑', count: 4, Icon: Clock },
] as const;

export function LibrarySidebar() {
  const [activeSectionId, setActiveSectionId] = useState<string>('all');

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-4 md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <BrandMark />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">MuDiagram</span>
      </div>
      <Link to="/project/new" className={`${PRIMARY_BUTTON_CLASS} mt-5 h-10 w-full rounded-xl text-sm`}>
        <Plus className="size-4" strokeWidth={2} />
        新建项目
      </Link>
      <nav className="mt-5 space-y-0.5">
        {LIBRARY_SECTIONS.map(({ id, label, count, Icon }) => {
          const isActive = id === activeSectionId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSectionId(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${isActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-interactive-hover hover:text-foreground'}`}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              <span className="flex-1 text-left">{label}</span>
              <span className="text-xs tabular-nums text-faint">{count}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
