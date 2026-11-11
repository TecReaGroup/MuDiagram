import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { readInitialPrompt } from '../../features/ai-assistant/initial-prompt';
import { getProject, readDiagramXml, type Project } from '../../entities/project/project-api';
import { AiChatPanel } from '../../features/ai-assistant/AiChatPanel';
import { DiagramCanvas } from '../../features/diagram-editor/DiagramCanvas';
import { useDiagramDocument, type SaveStatus } from '../../features/diagram-editor/use-diagram-document';
import { SharePanel } from '../../features/project-share/SharePanel';
import { log, serializeError } from '../../shared/lib/logger';
import { BrandMark } from '../../shared/ui/BrandMark';
import { GHOST_BUTTON_CLASS, OUTLINE_BUTTON_CLASS } from '../../shared/ui/control-class';

const SAVE_STATUS_LABELS: Record<SaveStatus, string> = {
  saved: '已保存',
  unsaved: '未保存',
  saving: '保存中…',
  failed: '保存失败',
};

type OpenedProject = { project: Project; xml: string };

export function EditorPage() {
  const { projectId = '' } = useParams();
  const [opened, setOpened] = useState<OpenedProject | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getProject(projectId), readDiagramXml(projectId)])
      .then(([project, xml]) => isCurrent && setOpened({ project, xml }))
      .catch(error => {
        log('error', 'Editor', 'Project open failed', { projectId, ...serializeError(error) });
        if (isCurrent) setFailure(error instanceof Error ? error.message : String(error));
      });
    return () => { isCurrent = false; };
  }, [projectId]);

  if (failure) return <p className="p-6 text-[13px] text-destructive">无法打开项目：{failure}</p>;
  if (!opened) return <p className="p-6 text-[13px] text-muted-foreground">加载中…</p>;
  return <EditorWorkspace key={projectId} initialProject={opened.project} initialXml={opened.xml} />;
}

function EditorWorkspace({ initialProject, initialXml }: { initialProject: Project; initialXml: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialPrompt] = useState(() => readInitialPrompt(location.state));
  // Drop the prompt from history so a reload does not send it again.
  useEffect(() => {
    if (initialPrompt) navigate(location.pathname, { replace: true, state: null });
  }, []);
  const [project, setProject] = useState(initialProject);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const diagram = useDiagramDocument(project.id, initialXml, setProject);

  async function returnToLibrary() {
    if (diagram.saveStatus !== 'saved') await diagram.saveNow();
    navigate('/');
  }

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex h-13 shrink-0 items-center gap-2 px-3">
        <BrandMark />
        <button type="button" onClick={() => void returnToLibrary()} className={GHOST_BUTTON_CLASS}>← Library</button>
        <span className="text-faint">/</span>
        <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{project.name}</h1>
        <span className={`shrink-0 text-xs ${diagram.saveStatus === 'failed' ? 'text-destructive' : 'text-faint'}`}>{SAVE_STATUS_LABELS[diagram.saveStatus]}</span>
        <div className="relative ml-auto flex gap-1.5">
          <button type="button" onClick={() => setIsSharePanelOpen(open => !open)} aria-expanded={isSharePanelOpen} className={OUTLINE_BUTTON_CLASS}>
            分享
            {project.shareToken && <span className="size-1.5 rounded-full bg-success" />}
          </button>
          <button type="button" onClick={() => setIsAiPanelOpen(open => !open)} aria-pressed={isAiPanelOpen} className={OUTLINE_BUTTON_CLASS}>
            {isAiPanelOpen ? '隐藏 AI' : 'AI 助手'}
          </button>
          {isSharePanelOpen && (
            <div className="absolute right-0 top-10 z-30 animate-fade-in">
              <SharePanel project={project} onProjectChange={setProject} />
            </div>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-card shadow-float">
          <DiagramCanvas initialXml={initialXml} diagram={diagram} />
        </div>
        {/* Hidden rather than unmounted so the conversation survives toggling. */}
        <div className={isAiPanelOpen ? 'w-96 shrink-0 animate-panel-in' : 'hidden'}>
          <AiChatPanel diagram={diagram} initialPrompt={initialPrompt} />
        </div>
      </div>
    </div>
  );
}
