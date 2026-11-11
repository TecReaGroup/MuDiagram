import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject, readDiagramXml, type Project } from '../../entities/project/project-api';
import { AiChatPanel } from '../../features/ai-assistant/AiChatPanel';
import { DiagramCanvas } from '../../features/diagram-editor/DiagramCanvas';
import { useDiagramDocument, type SaveStatus } from '../../features/diagram-editor/use-diagram-document';
import { SharePanel } from '../../features/project-share/SharePanel';
import { log, serializeError } from '../../shared/lib/logger';

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

  if (failure) return <p className="p-6 text-sm text-rose-600">无法打开项目：{failure}</p>;
  if (!opened) return <p className="p-6 text-sm text-slate-400">加载中…</p>;
  return <EditorWorkspace key={projectId} initialProject={opened.project} initialXml={opened.xml} />;
}

function EditorWorkspace({ initialProject, initialXml }: { initialProject: Project; initialXml: string }) {
  const navigate = useNavigate();
  const [project, setProject] = useState(initialProject);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const diagram = useDiagramDocument(project.id, initialXml, setProject);

  async function returnToLibrary() {
    if (diagram.saveStatus !== 'saved') await diagram.saveNow();
    navigate('/');
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
        <button type="button" onClick={() => void returnToLibrary()} className="text-sm text-slate-500 hover:text-slate-800">← Library</button>
        <h1 className="truncate text-sm font-semibold text-slate-800">{project.name}</h1>
        <span className={`text-xs ${diagram.saveStatus === 'failed' ? 'text-rose-600' : 'text-slate-400'}`}>{SAVE_STATUS_LABELS[diagram.saveStatus]}</span>
        <div className="relative ml-auto flex gap-2">
          <button type="button" onClick={() => setIsSharePanelOpen(open => !open)} className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">
            分享{project.shareToken ? ' · 已开启' : ''}
          </button>
          <button type="button" onClick={() => setIsAiPanelOpen(open => !open)} className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">
            {isAiPanelOpen ? '隐藏 AI' : 'AI 助手'}
          </button>
          {isSharePanelOpen && (
            <div className="absolute right-0 top-10 z-10">
              <SharePanel project={project} onProjectChange={setProject} />
            </div>
          )}
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <DiagramCanvas initialXml={initialXml} diagram={diagram} />
        </div>
        {/* Hidden rather than unmounted so the conversation survives toggling. */}
        <div className={isAiPanelOpen ? 'w-96 shrink-0' : 'hidden'}>
          <AiChatPanel diagram={diagram} />
        </div>
      </div>
    </div>
  );
}
