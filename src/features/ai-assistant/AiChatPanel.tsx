import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from 'ai';
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { log, serializeError } from '../../shared/lib/logger';
import { OUTLINE_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from '../../shared/ui/control-class';
import type { DiagramDocument } from '../diagram-editor/use-diagram-document';
import { applyCellOperations, readGraphModelXml, wrapCellsAsMxfile, type CellOperation } from './diagram-xml';

const CHAT_API = '/api/ai/chat';
// A failed tool call is sent back so the model can fix its XML; cap the retries per user message.
const MAX_TOOL_RETRIES = 3;

type ToolPart = {
  type: string;
  toolCallId: string;
  state: string;
  errorText?: string;
};

function isToolPart(part: UIMessage['parts'][number]): part is UIMessage['parts'][number] & ToolPart {
  return part.type.startsWith('tool-');
}

function lastAssistantToolFailed(messages: UIMessage[]): boolean {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.role === 'assistant'
    && lastMessage.parts.some(part => isToolPart(part) && part.state === 'output-error');
}

const TOOL_PENDING_CLASS = 'border-border bg-card text-muted-foreground';
// The marker color is reserved for what the AI just changed on the canvas.
const TOOL_STATE_CLASSES: Record<string, string> = {
  'output-available': 'border-transparent bg-marker-soft text-marker-ink',
  'output-error': 'border-destructive/25 bg-destructive/5 text-destructive',
};

function describeToolPart(part: ToolPart): string {
  const action = part.type === 'tool-display_diagram' ? '绘制图表' : '编辑图表';
  if (part.state === 'output-available') return `✓ ${action}`;
  if (part.state === 'output-error') return `✗ ${action}失败：${part.errorText ?? ''}`;
  return `… 正在${action}`;
}

type AiChatPanelProps = {
  diagram: DiagramDocument;
  /** Sent once as the first message as soon as the canvas can take the AI's diagram. */
  initialPrompt?: string;
};

export function AiChatPanel({ diagram, initialPrompt }: AiChatPanelProps) {
  const [draft, setDraft] = useState('');
  const toolRetriesRef = useRef(0);
  const isInitialPromptSentRef = useRef(false);

  const transport = useMemo(() => new DefaultChatTransport({
    api: CHAT_API,
    prepareSendMessagesRequest: async ({ messages }) => ({
      body: { messages, xml: await readGraphModelXml(diagram.readXml()) },
    }),
  }), [diagram.readXml]);

  const { messages, sendMessage, addToolOutput, status, stop, error } = useChat({
    transport,
    sendAutomaticallyWhen: options => {
      if (!lastAssistantMessageIsCompleteWithToolCalls(options) || !lastAssistantToolFailed(options.messages)) return false;
      toolRetriesRef.current += 1;
      return toolRetriesRef.current <= MAX_TOOL_RETRIES;
    },
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      try {
        if (toolCall.toolName === 'display_diagram') {
          const { xml } = toolCall.input as { xml: string };
          diagram.replaceXml(wrapCellsAsMxfile(xml));
          addToolOutput({ tool: 'display_diagram', toolCallId: toolCall.toolCallId, output: 'Diagram displayed on the canvas.' });
        } else if (toolCall.toolName === 'edit_diagram') {
          const { operations } = toolCall.input as { operations: CellOperation[] };
          diagram.replaceXml(await applyCellOperations(diagram.readXml(), operations));
          addToolOutput({ tool: 'edit_diagram', toolCallId: toolCall.toolCallId, output: `Applied ${operations.length} operation(s).` });
        }
      } catch (toolError) {
        log('warn', 'AiAssistant', 'Diagram tool failed', { tool: toolCall.toolName, ...serializeError(toolError) });
        addToolOutput({
          tool: toolCall.toolName as 'display_diagram' | 'edit_diagram',
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: toolError instanceof Error ? toolError.message : String(toolError),
        });
      }
    },
  });

  const isBusy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (!initialPrompt || !diagram.isCanvasReady || isInitialPromptSentRef.current) return;
    isInitialPromptSentRef.current = true;
    void sendMessage({ text: initialPrompt });
  }, [initialPrompt, diagram.isCanvasReady, sendMessage]);

  function submitDraft(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    toolRetriesRef.current = 0;
    void sendMessage({ text });
    setDraft('');
  }

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submitDraft(event);
  }

  return (
    <aside className="flex h-full w-full flex-col rounded-2xl bg-card shadow-float">
      <header className="flex h-13 shrink-0 items-center gap-2 px-4">
        <span className="size-2 rounded-full bg-marker" />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">AI 助手</span>
      </header>
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-2 text-sm">
        {messages.length === 0 && (
          <p className="px-4 pt-10 text-center text-[13px] text-muted-foreground">描述你想要的架构图，例如：“画一个电商系统的微服务架构，包含网关、订单、库存、支付服务和 MySQL、Redis、Kafka”。</p>
        )}
        {messages.map(message => (
          <div key={message.id} className={message.role === 'user' ? 'animate-message-in ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-3.5 py-2.5' : 'animate-message-in mr-2 space-y-1.5'}>
            {message.parts.map((part, index) => {
              if (part.type === 'text') return <p key={index} className="whitespace-pre-wrap wrap-break-word text-foreground">{part.text}</p>;
              if (isToolPart(part)) {
                return (
                  <p key={part.toolCallId} className={`w-fit rounded-lg border px-2.5 py-1.5 text-xs ${TOOL_STATE_CLASSES[part.state] ?? TOOL_PENDING_CLASS}`}>
                    {describeToolPart(part)}
                  </p>
                );
              }
              return null;
            })}
          </div>
        ))}
        {error && <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-[13px] text-destructive">请求失败：{error.message}</p>}
      </div>
      <form onSubmit={submitDraft} className="mx-3 mt-1 mb-3 rounded-[14px] border border-border bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-foreground/20 focus-within:shadow-[0_0_0_4px_var(--accent)]">
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={submitOnEnter}
          rows={3}
          placeholder="Enter 发送，Shift+Enter 换行"
          className="scrollbar-thin block min-h-13 w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-sm text-foreground outline-none placeholder:text-faint"
        />
        <div className="flex justify-end px-1.5 pt-0.5 pb-1.5">
          {isBusy ? (
            <button type="button" onClick={() => void stop()} className={`${OUTLINE_BUTTON_CLASS} rounded-[10px]`}>停止</button>
          ) : (
            <button type="submit" disabled={!draft.trim()} className={`${PRIMARY_BUTTON_CLASS} rounded-[10px]`}>发送</button>
          )}
        </div>
      </form>
    </aside>
  );
}
