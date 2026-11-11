import { ChevronRight, CloudCheck, Share2, Sparkle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findSampleProject } from '../../entities/project/sample-project';
import { AiChatPanel } from '../../features/ai-assistant/AiChatPanel';
import { DiagramCanvas } from '../../features/diagram-editor/DiagramCanvas';
import { SharePanel } from '../../features/project-share/SharePanel';
import { BrandMark } from '../../shared/ui/BrandMark';
import { buttonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';

export function EditorPage() {
  const { projectId = '' } = useParams();
  const project = findSampleProject(projectId);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-1 px-3">
        <Link to="/" aria-label="返回全部图表" className="rounded-lg p-0.5 transition-opacity hover:opacity-80">
          <BrandMark className="size-6" />
        </Link>
        <nav className="flex min-w-0 items-center gap-1 text-[13px]">
          <Link to="/" className="hidden rounded-md px-1.5 py-1 text-ink-muted transition-colors hover:bg-hover hover:text-ink sm:block">全部图表</Link>
          <ChevronRight className="hidden size-3.5 shrink-0 text-ink-faint sm:block" />
          <h1 className="truncate px-1.5 text-[13px] font-medium">{project.name}</h1>
        </nav>
        <span className="flex shrink-0 items-center gap-1 text-xs text-ink-faint" title="所有更改已保存">
          <CloudCheck className="size-3.5" />
          <span className="hidden sm:inline">已保存</span>
        </span>

        <div className="relative ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSharePanelOpen(open => !open)}
            aria-expanded={isSharePanelOpen}
            className={buttonClass('secondary')}
          >
            <Share2 />
            分享
            {project.isShared && <span className="size-1.5 rounded-full bg-success" aria-label="已公开" />}
          </button>
          <button
            type="button"
            onClick={() => setIsAiPanelOpen(open => !open)}
            aria-pressed={isAiPanelOpen}
            className={buttonClass(isAiPanelOpen ? 'accent' : 'primary')}
          >
            <Sparkle />
            AI 助手
          </button>
          {isSharePanelOpen && (
            <div className="absolute top-10 right-0 z-30 origin-top-right animate-pop-in">
              <SharePanel initiallyShared={project.isShared} />
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <div className={`${SURFACE_CARD_CLASS} min-w-0 flex-1 overflow-hidden`}>
          <DiagramCanvas />
        </div>
        {isAiPanelOpen && (
          <div className="w-[380px] shrink-0 animate-panel-in max-lg:fixed max-lg:inset-y-2 max-lg:right-2 max-lg:z-20 max-lg:w-[min(380px,calc(100vw-16px))]">
            <AiChatPanel onClose={() => setIsAiPanelOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
