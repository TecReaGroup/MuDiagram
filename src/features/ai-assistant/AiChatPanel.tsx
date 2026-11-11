import { useState, type FormEvent } from 'react';
import { PRIMARY_BUTTON_CLASS } from '../../shared/ui/control-class';

type SampleMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; toolStatus: 'done' | 'failed' | 'running' };

const SAMPLE_MESSAGES: SampleMessage[] = [
  { id: '1', role: 'user', text: '画一个电商系统的微服务架构，包含网关、订单、库存、支付服务和 MySQL、Redis、Kafka' },
  { id: '2', role: 'assistant', text: '已生成架构图：API 网关后接订单、库存、支付三个服务，服务间通过 Kafka 异步通信，订单和库存共用 MySQL，Redis 做缓存。', toolStatus: 'done' },
];

const TOOL_STATUS_STYLES = {
  done: { label: '✓ 绘制图表', className: 'border-transparent bg-marker-soft text-marker-ink' },
  failed: { label: '✗ 绘制图表失败', className: 'border-destructive/25 bg-destructive/5 text-destructive' },
  running: { label: '… 正在绘制图表', className: 'border-border bg-card text-muted-foreground' },
} as const;

export function AiChatPanel() {
  const [draft, setDraft] = useState('');

  return (
    <aside className="flex h-full w-full flex-col rounded-2xl bg-card shadow-float">
      <header className="flex h-13 shrink-0 items-center gap-2 px-4">
        <span className="size-2 rounded-full bg-marker" />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">AI 助手</span>
      </header>
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-2 text-sm">
        {SAMPLE_MESSAGES.map(message => message.role === 'user' ? (
          <div key={message.id} className="animate-message-in ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-3.5 py-2.5">
            <p className="whitespace-pre-wrap wrap-break-word text-foreground">{message.text}</p>
          </div>
        ) : (
          <div key={message.id} className="animate-message-in mr-2 space-y-1.5">
            <p className={`w-fit rounded-lg border px-2.5 py-1.5 text-xs ${TOOL_STATUS_STYLES[message.toolStatus].className}`}>
              {TOOL_STATUS_STYLES[message.toolStatus].label}
            </p>
            <p className="whitespace-pre-wrap wrap-break-word text-foreground">{message.text}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={(event: FormEvent) => event.preventDefault()}
        className="mx-3 mt-1 mb-3 rounded-[14px] border border-border bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-foreground/20 focus-within:shadow-[0_0_0_4px_var(--accent)]"
      >
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          rows={3}
          placeholder="Enter 发送，Shift+Enter 换行"
          className="scrollbar-thin block min-h-13 w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-sm text-foreground outline-none placeholder:text-faint"
        />
        <div className="flex justify-end px-1.5 pt-0.5 pb-1.5">
          <button type="submit" disabled={!draft.trim()} className={`${PRIMARY_BUTTON_CLASS} rounded-[10px]`}>发送</button>
        </div>
      </form>
    </aside>
  );
}
