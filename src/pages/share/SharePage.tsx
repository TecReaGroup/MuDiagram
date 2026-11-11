import { Download } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SAMPLE_PROJECTS } from '../../entities/project/sample-project';
import { BrandMark } from '../../shared/ui/BrandMark';

const DOWNLOAD_FORMATS = ['.drawio', 'SVG', 'PNG'] as const;

export function SharePage() {
  const { shareToken = '' } = useParams();
  const sharedProject = SAMPLE_PROJECTS[0];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{sharedProject.name}</h1>
            <div className="text-xs text-ink-faint">更新于 {sharedProject.updatedLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5 shadow-xs">
          <Download className="ml-2 size-4 text-ink-faint" />
          {DOWNLOAD_FORMATS.map(format => (
            <button key={format} type="button" className="h-7 rounded-md px-2.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-hover hover:text-ink">
              {format}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-4 sm:px-6">
        <div className="dot-grid flex aspect-video w-full max-w-5xl items-center justify-center rounded-2xl border border-line text-xs text-ink-faint shadow-card">
          分享图表预览 · {shareToken}
        </div>
      </main>

      <footer className="pb-5 text-center text-xs text-ink-faint">
        <Link to="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
          <BrandMark className="size-4" />
          使用 MuDiagram 创建
        </Link>
      </footer>
    </div>
  );
}
