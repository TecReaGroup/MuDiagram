import { useParams } from 'react-router-dom';
import { SAMPLE_PROJECTS } from '../../entities/project/sample-project';
import { BrandMark } from '../../shared/ui/BrandMark';
import { OUTLINE_BUTTON_CLASS } from '../../shared/ui/control-class';

const DOWNLOAD_LABELS = ['下载 .drawio', 'SVG', 'PNG'] as const;

export function SharePage() {
  const { shareToken = '' } = useParams();
  const sharedProject = SAMPLE_PROJECTS[0];

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="m-3 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card py-2 pr-2 pl-3 shadow-float">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{sharedProject.name}</h1>
            <div className="text-xs text-faint">更新于 {sharedProject.updatedLabel}</div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {DOWNLOAD_LABELS.map(label => <button key={label} type="button" className={OUTLINE_BUTTON_CLASS}>{label}</button>)}
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex aspect-video w-full max-w-4xl items-center justify-center rounded-2xl bg-white p-6 text-xs text-faint shadow-float">
          分享图表预览 · {shareToken}
        </div>
      </main>
    </div>
  );
}
