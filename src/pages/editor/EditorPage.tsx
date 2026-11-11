import { ChevronRight, CloudCheck, Share2, Sparkle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listFolders, type Folder } from '../../entities/folder/folder-api';
import { getProject, type Project } from '../../entities/project/project-api';
import { AiChatPanel } from '../../features/ai-assistant/AiChatPanel';
import { DiagramCanvas } from '../../features/diagram-editor/DiagramCanvas';
import { SharePanel } from '../../features/project-share/SharePanel';
import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';
import { buttonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';

export function EditorPage() {
  const { t } = useI18n();
  const { projectId = '' } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const isShared = project?.shareToken != null;

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getProject(projectId), listFolders()]).then(
      ([loadedProject, folders]) => {
        if (!isCurrent) return;
        setProject(loadedProject);
        setFolder(folders.find(candidate => candidate.id === loadedProject.folderId) ?? null);
      },
      () => {
        if (!isCurrent) return;
        setProject(null);
        setFolder(null);
      },
    );
    return () => { isCurrent = false; };
  }, [projectId]);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-3 px-3">
        <Link to="/" aria-label={t('editor.backToLibrary')} className="rounded-lg p-0.5 transition-opacity hover:opacity-80">
          <BrandMark className="size-6" />
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 text-[13px]">
          <Link
            to={folder ? `/folder/${folder.id}` : '/'}
            className="hidden max-w-48 truncate rounded-md px-1.5 py-1 text-ink-muted transition-colors hover:bg-hover hover:text-ink sm:block"
          >
            {folder?.name ?? t('library.allProjects')}
          </Link>
          <ChevronRight className="hidden size-3.5 shrink-0 text-ink-faint sm:block" />
          <h1 className="truncate px-1.5 text-[13px] font-medium">{project?.name}</h1>
        </nav>
        <span className="flex shrink-0 items-center gap-1 text-xs text-ink-faint" title={t('editor.allChangesSaved')}>
          <CloudCheck className="size-3.5" />
          <span className="hidden sm:inline">{t('editor.saved')}</span>
        </span>

        <div className="relative ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSharePanelOpen(open => !open)}
            aria-expanded={isSharePanelOpen}
            className={buttonClass('secondary')}
          >
            <Share2 />
            {t('editor.share')}
            {isShared && <span className="size-1.5 rounded-full bg-success" aria-label={t('editor.isPublic')} />}
          </button>
          <button
            type="button"
            onClick={() => setIsAiPanelOpen(open => !open)}
            aria-pressed={isAiPanelOpen}
            className={buttonClass(isAiPanelOpen ? 'accent' : 'primary')}
          >
            <Sparkle />
            {t('ai.assistant')}
          </button>
          {isSharePanelOpen && (
            <div className="absolute top-10 right-0 z-30 origin-top-right animate-pop-in">
              <SharePanel initiallyShared={isShared} />
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <div className={`${SURFACE_CARD_CLASS} min-w-0 flex-1 overflow-hidden`}>
          <DiagramCanvas key={projectId} projectId={projectId} />
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
