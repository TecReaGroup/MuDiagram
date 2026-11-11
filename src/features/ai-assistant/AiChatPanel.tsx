import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from 'ai';
import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { log, serializeError } from '../../shared/lib/logger';
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

function describeToolPart(part: ToolPart): string {
  const action = part.type === 'tool-display_diagram' ? '绘制图表' : '编辑图表';
  if (part.state === 'output-available') return `✓ ${action}`;
  if (part.state === 'output-error') return `✗ ${action}失败：${part.errorText ?? ''}`;
  return `… 正在${action}`;
}

export function AiChatPanel({ diagram }: { diagram: DiagramDocument }) {
  const [draft, setDraft] = useState('');
  const toolRetriesRef = useRef(0);

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
    <aside className="flex h-full w-full flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">AI 助手</header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {messages.length === 0 && (
          <p className="text-slate-400">描述你想要的架构图，例如：“画一个电商系统的微服务架构，包含网关、订单、库存、支付服务和 MySQL、Redis、Kafka”。</p>
        )}
        {messages.map(message => (
          <div key={message.id} className={message.role === 'user' ? 'ml-6 rounded-lg bg-slate-100 px-3 py-2' : 'mr-2'}>
            {message.parts.map((part, index) => {
              if (part.type === 'text') return <p key={index} className="whitespace-pre-wrap text-slate-800">{part.text}</p>;
              if (isToolPart(part)) {
                return (
                  <p key={part.toolCallId} className={part.state === 'output-error' ? 'text-xs text-rose-600' : 'text-xs text-slate-500'}>
                    {describeToolPart(part)}
                  </p>
                );
              }
              return null;
            })}
          </div>
        ))}
        {error && <p className="text-xs text-rose-600">请求失败：{error.message}</p>}
      </div>
      <form onSubmit={submitDraft} className="border-t border-slate-200 p-3">
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={submitOnEnter}
          rows={3}
          placeholder="Enter 发送，Shift+Enter 换行"
          className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
        <div className="mt-2 flex justify-end">
          {isBusy ? (
            <button type="button" onClick={() => void stop()} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">停止</button>
          ) : (
            <button type="submit" disabled={!draft.trim()} className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-40">发送</button>
          )}
        </div>
      </form>
    </aside>
  );
}
