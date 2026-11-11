import { ArrowUp, Check, CircleExclamationPoint, LoaderCircle, Square, SquarePen, X } from 'lucide-react';
import type { FileUIPart } from 'ai';
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent, type RefObject } from 'react';
import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';
import { FIELD_FOCUS_CLASS, FOCUS_RING, iconButtonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';
import type { DiagramCanvasHandle } from '../diagram-editor/DiagramCanvas';
import type { DiagramCheckpoints } from './chat-history-api';
import { ChatHistoryMenu } from './ChatHistoryMenu';
import { CheckpointPreviewModal } from './CheckpointPreviewModal';
import { MAX_IMAGES_PER_MESSAGE, readPastedImages } from './pasted-image';
import { useDiagramChat, type DiagramChatMessage } from './use-diagram-chat';

type ToolStatus = 'done' | 'failed' | 'running';
type MessagePart = DiagramChatMessage['parts'][number];

const TOOL_STATUS_STYLES = {
  done: { labelKey: 'ai.toolDone', Icon: Check, className: 'bg-brand-soft text-brand-ink' },
  failed: { labelKey: 'ai.toolFailed', Icon: CircleExclamationPoint, className: 'bg-danger-soft text-danger' },
  running: { labelKey: 'ai.toolRunning', Icon: LoaderCircle, className: 'bg-sunken text-ink-muted [&_svg]:animate-spin' },
} as const;

const SEND_BUTTON_CLASS = 'inline-flex size-7 items-center justify-center rounded-lg bg-ink text-white transition-[background-color,opacity] hover:bg-ink/85 disabled:bg-hover disabled:text-ink-faint';

function ToolStatusChip({ status, detail }: { status: ToolStatus; detail?: string }) {
  const { t } = useI18n();
  const { labelKey, Icon, className } = TOOL_STATUS_STYLES[status];
  return (
    <span title={detail} className={`inline-flex h-6 w-fit items-center gap-1 rounded-md px-2 text-xs font-medium ${className}`}>
      <Icon className="size-3.5" />
      {t(labelKey)}
    </span>
  );
}

/** The "updated" chip of an applied call, opening the diagram that call produced. */
function CheckpointChip({ onPreview }: { onPreview: () => void }) {
  const { t } = useI18n();
  const { labelKey, Icon, className } = TOOL_STATUS_STYLES.done;
  return (
    <button
      type="button"
      onClick={onPreview}
      title={t('ai.previewCheckpoint')}
      className={`group inline-flex h-6 w-fit items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors hover:bg-brand-soft/70 ${FOCUS_RING} ${className}`}
    >
      <Icon className="size-3.5" />
      {t(labelKey)}
      <span className="ml-1 inline-flex items-center gap-1.5 text-brand-ink/70 group-hover:text-brand-ink">
        <span aria-hidden className="text-base leading-none">·</span>
        {t('ai.previewCheckpoint')}
      </span>
    </button>
  );
}

type AssistantPartProps = {
  part: MessagePart;
  checkpoints: DiagramCheckpoints;
  onPreviewCheckpoint: (checkpointXml: string) => void;
};

function AssistantPart({ part, checkpoints, onPreviewCheckpoint }: AssistantPartProps) {
  switch (part.type) {
    case 'text':
      return <p className="whitespace-pre-wrap wrap-break-word">{part.text}</p>;
    case 'tool-display_diagram':
    case 'tool-edit_diagram': {
      const checkpointXml = checkpoints[part.toolCallId];
      if (part.state === 'output-available' && checkpointXml) {
        return <CheckpointChip onPreview={() => onPreviewCheckpoint(checkpointXml)} />;
      }
      if (part.state === 'output-available') return <ToolStatusChip status="done" />;
      if (part.state === 'output-error') return <ToolStatusChip status="failed" detail={part.errorText} />;
      return <ToolStatusChip status="running" />;
    }
    default:
      return null;
  }
}

type ChatMessageProps = Omit<AssistantPartProps, 'part'> & { message: DiagramChatMessage };

function ChatMessage({ message, ...checkpointProps }: ChatMessageProps) {
  if (message.role === 'user') {
    const text = message.parts.map(part => part.type === 'text' ? part.text : '').join('');
    const images = message.parts.filter(part => part.type === 'file');
    return (
      <div className="ml-auto flex w-fit max-w-[85%] animate-fade-in flex-col items-end gap-1.5">
        {images.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {images.map((image, index) => (
              <img key={index} src={image.url} alt={image.filename ?? ''} className="max-h-40 max-w-full rounded-xl border border-line object-contain" />
            ))}
          </div>
        )}
        {text && (
          <div className="rounded-2xl rounded-tr-md bg-sunken px-3.5 py-2">
            <p className="whitespace-pre-wrap wrap-break-word">{text}</p>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex animate-fade-in gap-2.5">
      <BrandMark className="mt-0.5 size-5" />
      <div className="flex min-w-0 flex-col gap-2">
        {message.parts.map((part, index) => <AssistantPart key={index} part={part} {...checkpointProps} />)}
      </div>
    </div>
  );
}

type AiChatPanelProps = {
  projectId: string;
  canvasRef: RefObject<DiagramCanvasHandle | null>;
  onClose: () => void;
};

export function AiChatPanel({ projectId, canvasRef, onClose }: AiChatPanelProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const [draftImages, setDraftImages] = useState<FileUIPart[]>([]);
  const [previewedCheckpointXml, setPreviewedCheckpointXml] = useState<string | null>(null);
  const { chatId, messages, checkpoints, error, isBusy, sendMessage, stop, startNewChat, openChat, deleteChat } = useDiagramChat(canvasRef, projectId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isWaitingForReply = isBusy && messages[messages.length - 1]?.role === 'user';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, error]);

  const submitDraft = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if ((!text && draftImages.length === 0) || isBusy) return;
    void sendMessage(text, draftImages);
    setDraft('');
    setDraftImages([]);
  };

  // Plain-text pastes fall through to the textarea; only image pastes are taken over.
  const attachPastedImages = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!Array.from(event.clipboardData.files).some(file => file.type.startsWith('image/'))) return;
    event.preventDefault();
    const pastedImages = await readPastedImages(event.clipboardData);
    setDraftImages(current => [...current, ...pastedImages].slice(0, MAX_IMAGES_PER_MESSAGE));
  };

  const removeDraftImage = (removedIndex: number) => {
    setDraftImages(current => current.filter((_, index) => index !== removedIndex));
  };

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing: Enter that confirms an IME candidate (e.g. Chinese input) must not send.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <aside className={`${SURFACE_CARD_CLASS} relative flex h-full w-full flex-col max-lg:shadow-pop`}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line pr-2 pl-4">
        <span className="flex-1 text-ui font-semibold">{t('ai.assistant')}</span>
        <ChatHistoryMenu
          projectId={projectId}
          currentChatId={chatId}
          isDisabled={isBusy}
          onOpenChat={openChat}
          onDeleteChat={deleteChat}
        />
        <button type="button" onClick={startNewChat} aria-label={t('ai.newChat')} title={t('ai.newChat')} className={iconButtonClass()}>
          <SquarePen />
        </button>
        <button type="button" onClick={onClose} aria-label={t('common.close')} title={t('common.close')} className={iconButtonClass()}>
          <X />
        </button>
      </header>

      <div ref={scrollRef} className="scrollbar-subtle flex-1 space-y-5 overflow-y-auto px-4 py-5 text-chat leading-relaxed">
        {messages.length === 0 && (
          <p className="px-4 pt-8 text-center text-ui text-ink-faint">{t('ai.emptyHint')}</p>
        )}
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} checkpoints={checkpoints} onPreviewCheckpoint={setPreviewedCheckpointXml} />
        ))}
        {isWaitingForReply && (
          <div className="flex animate-fade-in items-center gap-2.5 text-ink-faint">
            <BrandMark className="size-5" />
            <LoaderCircle className="size-4 animate-spin" aria-label={t('ai.thinking')} />
          </div>
        )}
        {error && (
          <p className="animate-fade-in rounded-lg bg-danger-soft px-3 py-2 text-ui wrap-break-word text-danger">{error.message}</p>
        )}
      </div>

      <form onSubmit={submitDraft} className={`${SURFACE_CARD_CLASS} ${FIELD_FOCUS_CLASS} m-2.5 mt-0`}>
        {draftImages.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-2.5">
            {draftImages.map((image, index) => (
              <div key={index} className="group relative">
                <img src={image.url} alt={image.filename ?? ''} className="size-14 rounded-lg border border-line object-cover" />
                <button
                  type="button"
                  onClick={() => removeDraftImage(index)}
                  aria-label={t('ai.removeImage')}
                  title={t('ai.removeImage')}
                  className={`absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-ink text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 ${FOCUS_RING}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={submitOnEnter}
          onPaste={event => void attachPastedImages(event)}
          rows={2}
          placeholder={t('ai.inputPlaceholder')}
          className="scrollbar-subtle block max-h-40 min-h-14 w-full resize-none bg-transparent px-3 pt-2.5 text-chat text-ink outline-none field-sizing-content placeholder:text-ink-faint"
        />
        <div className="flex items-center justify-between py-1.5 pr-1.5 pl-3">
          <span className="text-2xs text-ink-faint">{t('ai.inputHint')}</span>
          {isBusy ? (
            <button type="button" onClick={() => void stop()} aria-label={t('ai.stop')} title={t('ai.stop')} className={SEND_BUTTON_CLASS}>
              <Square className="size-3 fill-current" />
            </button>
          ) : (
            <button type="submit" disabled={!draft.trim() && draftImages.length === 0} aria-label={t('ai.send')} className={SEND_BUTTON_CLASS}>
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
      </form>

      <CheckpointPreviewModal
        checkpointXml={previewedCheckpointXml}
        onClose={() => setPreviewedCheckpointXml(null)}
        onRestore={checkpointXml => canvasRef.current?.loadXml(checkpointXml)}
      />
    </aside>
  );
}
