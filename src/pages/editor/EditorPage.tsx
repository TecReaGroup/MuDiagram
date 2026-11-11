import { ChevronRight, CloudCheck, Share2, Sparkle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { folderListQuery } from '../../entities/folder/folder-query';
import { storeProject, useProject } from '../../entities/project/project-query';
import { AiChatPanel } from '../../features/ai-assistant/AiChatPanel';
import { DiagramCanvas, type DiagramCanvasHandle } from '../../features/diagram-editor/DiagramCanvas';
import { SharePanel } from '../../features/project-share/SharePanel';
import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';
import { buttonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';
import { usePopover } from '../../shared/ui/use-popover';

export function EditorPage() {
  const { t } = useI18n();
  const { projectId = '' } = useParams();
  const queryClient = useQueryClient();
  const { data: project } = useProject(projectId);
  const { data: folders } = useQuery(folderListQuery);
  const folder = folders?.find(candidate => candidate.id === project?.folderId);
  const canvasRef = useRef<DiagramCanvasHandle>(null);
  const sharePopover = usePopover<HTMLDivElement>();
  const isShared = project?.shareToken != null;
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-3 px-3">
        <Link to="/" aria-label={t('editor.backToLibrary')} className="rounded-lg p-0.5 transition-opacity hover:opacity-80">
          <BrandMark className="size-6" />
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 text-ui">
          <Link
            to={folder ? `/folder/${folder.id}` : '/'}
            className="hidden max-w-48 truncate rounded-md px-1.5 py-1 text-ink-muted transition-colors hover:bg-hover hover:text-ink sm:block"
          >
            {folder?.name ?? t('library.allProjects')}
          </Link>
          <ChevronRight className="hidden size-3.5 shrink-0 text-ink-faint sm:block" />
          <h1 className="truncate px-1.5 text-ui font-medium">{project?.name}</h1>
        </nav>
        <span className="flex shrink-0 items-center gap-1 text-xs text-ink-faint" title={t('editor.allChangesSaved')}>
          <CloudCheck className="size-3.5" />
          <span className="hidden sm:inline">{t('editor.saved')}</span>
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <div ref={sharePopover.rootRef} className="relative">
            <button
              type="button"
              onClick={sharePopover.toggle}
              aria-expanded={sharePopover.isOpen}
              className={`relative ${buttonClass('secondary')}`}
            >
              <Share2 />
              {t('editor.share')}
              {isShared && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-success" aria-label={t('editor.isPublic')} />}
            </button>
            {sharePopover.isOpen && project && (
              <div className="absolute top-10 right-0 z-30 origin-top-right animate-pop-in">
                <SharePanel project={project} onProjectChange={changed => storeProject(queryClient, changed)} />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAiPanelOpen(open => !open)}
            aria-pressed={isAiPanelOpen}
            className={buttonClass(isAiPanelOpen ? 'accent' : 'primary')}
          >
            <Sparkle />
            {t('ai.assistant')}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <div className={`${SURFACE_CARD_CLASS} min-w-0 flex-1 overflow-hidden`}>
          <DiagramCanvas key={projectId} ref={canvasRef} projectId={projectId} />
        </div>
        {/* Hidden rather than unmounted, so closing the panel keeps the conversation. */}
        <div className={`${isAiPanelOpen ? '' : 'hidden'} w-[380px] shrink-0 animate-panel-in max-lg:fixed max-lg:inset-y-2 max-lg:right-2 max-lg:z-20 max-lg:w-[min(380px,calc(100vw-16px))]`}>
          <AiChatPanel key={projectId} projectId={projectId} canvasRef={canvasRef} onClose={() => setIsAiPanelOpen(false)} />
        </div>
      </div>
    </div>
  );
}
