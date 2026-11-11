import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findSampleProject } from '../../entities/project/sample-project';
import { AiChatPanel } from '../../features/ai-assistant/AiChatPanel';
import { DiagramCanvas } from '../../features/diagram-editor/DiagramCanvas';
import { SharePanel } from '../../features/project-share/SharePanel';
import { BrandMark } from '../../shared/ui/BrandMark';
import { GHOST_BUTTON_CLASS, OUTLINE_BUTTON_CLASS } from '../../shared/ui/control-class';

export function EditorPage() {
  const { projectId = '' } = useParams();
  const project = findSampleProject(projectId);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex h-13 shrink-0 items-center gap-2 px-3">
        <BrandMark />
        <Link to="/" className={GHOST_BUTTON_CLASS}>← Library</Link>
        <span className="text-faint">/</span>
        <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{project.name}</h1>
        <span className="shrink-0 text-xs text-faint">已保存</span>
        <div className="relative ml-auto flex gap-1.5">
          <button type="button" onClick={() => setIsSharePanelOpen(open => !open)} aria-expanded={isSharePanelOpen} className={OUTLINE_BUTTON_CLASS}>
            分享
            {project.isShared && <span className="size-1.5 rounded-full bg-success" />}
          </button>
          <button type="button" onClick={() => setIsAiPanelOpen(open => !open)} aria-pressed={isAiPanelOpen} className={OUTLINE_BUTTON_CLASS}>
            {isAiPanelOpen ? '隐藏 AI' : 'AI 助手'}
          </button>
          {isSharePanelOpen && (
            <div className="absolute right-0 top-10 z-30 animate-fade-in">
              <SharePanel initiallyShared={project.isShared} />
            </div>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-card shadow-float">
          <DiagramCanvas />
        </div>
        {isAiPanelOpen && (
          <div className="w-96 shrink-0 animate-panel-in">
            <AiChatPanel />
          </div>
        )}
      </div>
    </div>
  );
}
