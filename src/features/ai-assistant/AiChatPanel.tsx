import { ArrowUp, Check, CircleExclamationPoint, LoaderCircle, SquarePen, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useI18n } from '../../shared/i18n/language-context';
import { BrandMark } from '../../shared/ui/BrandMark';
import { FIELD_FOCUS_CLASS, iconButtonClass, SURFACE_CARD_CLASS } from '../../shared/ui/control-class';

type ToolStatus = 'done' | 'failed' | 'running';

type SampleMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; toolStatus: ToolStatus };

const SAMPLE_MESSAGES: SampleMessage[] = [
  { id: '1', role: 'user', text: '画一个电商系统的微服务架构，包含网关、订单、库存、支付服务和 MySQL、Redis、Kafka' },
  { id: '2', role: 'assistant', text: '已生成架构图：API 网关后接订单、库存、支付三个服务，服务间通过 Kafka 异步通信，订单和库存共用 MySQL，Redis 做缓存。', toolStatus: 'done' },
];

const TOOL_STATUS_STYLES = {
  done: { labelKey: 'ai.toolDone', Icon: Check, className: 'bg-brand-soft text-brand-ink' },
  failed: { labelKey: 'ai.toolFailed', Icon: CircleExclamationPoint, className: 'bg-danger-soft text-danger' },
  running: { labelKey: 'ai.toolRunning', Icon: LoaderCircle, className: 'bg-sunken text-ink-muted [&_svg]:animate-spin' },
} as const;

function ToolStatusChip({ status }: { status: ToolStatus }) {
  const { t } = useI18n();
  const { labelKey, Icon, className } = TOOL_STATUS_STYLES[status];
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium ${className}`}>
      <Icon className="size-3.5" />
      {t(labelKey)}
    </span>
  );
}

export function AiChatPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');

  return (
    <aside className={`${SURFACE_CARD_CLASS} flex h-full w-full flex-col max-lg:shadow-pop`}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line pr-2 pl-4">
        <span className="flex-1 text-[13px] font-semibold">{t('ai.assistant')}</span>
        <button type="button" aria-label={t('ai.newChat')} title={t('ai.newChat')} className={iconButtonClass()}>
          <SquarePen />
        </button>
        <button type="button" onClick={onClose} aria-label={t('common.close')} title={t('common.close')} className={iconButtonClass()}>
          <X />
        </button>
      </header>

      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-4 py-5 text-[13.5px] leading-relaxed">
        {SAMPLE_MESSAGES.map(message => message.role === 'user' ? (
          <div key={message.id} className="ml-auto w-fit max-w-[85%] animate-fade-in rounded-2xl rounded-tr-md bg-sunken px-3.5 py-2">
            <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>
          </div>
        ) : (
          <div key={message.id} className="flex animate-fade-in gap-2.5">
            <BrandMark className="mt-0.5 size-5" />
            <div className="min-w-0 space-y-2">
              <ToolStatusChip status={message.toolStatus} />
              <p className="whitespace-pre-wrap wrap-break-word">{message.text}</p>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event: FormEvent) => event.preventDefault()}
        className={`${SURFACE_CARD_CLASS} ${FIELD_FOCUS_CLASS} m-2.5 mt-0`}
      >
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value)}
          rows={2}
          placeholder={t('ai.inputPlaceholder')}
          className="scrollbar-thin block max-h-40 min-h-14 w-full resize-none bg-transparent px-3 pt-2.5 text-[13.5px] text-ink outline-none [field-sizing:content] placeholder:text-ink-faint"
        />
        <div className="flex items-center justify-between py-1.5 pr-1.5 pl-3">
          <span className="text-[11px] text-ink-faint">{t('ai.inputHint')}</span>
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label={t('ai.send')}
            className="inline-flex size-7 items-center justify-center rounded-lg bg-ink text-white transition-[background-color,opacity] hover:bg-ink/85 disabled:bg-hover disabled:text-ink-faint"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
