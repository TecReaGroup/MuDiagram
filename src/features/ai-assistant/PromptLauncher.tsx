import { Sparkles } from 'lucide-react';
import { useState, type FormEvent, type KeyboardEvent } from 'react';

const EXAMPLE_PROMPTS = [
  { label: 'AWS 三层 Web 应用', prompt: '一个部署在 AWS 上的三层 Web 应用：CloudFront + ALB 入口，ECS 运行应用服务，RDS 主从数据库，S3 存储静态资源' },
  { label: 'Kafka 事件驱动微服务', prompt: '基于 Kafka 的事件驱动微服务架构：订单、库存、支付、通知服务通过事件总线通信，包含 Schema Registry 和死信队列' },
  { label: 'K8s 多集群 + Istio', prompt: '两个 Kubernetes 集群通过 Istio 多集群服务网格互通，包含 Ingress Gateway、东西向网关和共享控制平面' },
  { label: 'RAG 检索增强服务', prompt: 'RAG 检索增强生成服务：文档切分与 Embedding 入库、向量数据库、检索与重排序、LLM 生成和 API 网关' },
] as const;

type PromptLauncherProps = {
  isLaunching: boolean;
  onLaunch: (prompt: string) => void;
};

/** The Library's "describe it in one sentence" box that starts a new AI-drawn project. */
export function PromptLauncher({ isLaunching, onLaunch }: PromptLauncherProps) {
  const [prompt, setPrompt] = useState('');

  function launch(event?: FormEvent) {
    event?.preventDefault();
    const text = prompt.trim();
    if (text && !isLaunching) onLaunch(text);
  }

  function launchOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) launch(event);
  }

  return (
    <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-pop sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
          <Sparkles className="size-4 text-marker" strokeWidth={1.75} />
          用一句话生成架构图
        </h2>
        <p className="text-xs text-primary-foreground/60">描述你的系统，AI 会生成可编辑的 draw.io 图</p>
      </div>
      <form onSubmit={launch} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <textarea
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          onKeyDown={launchOnEnter}
          rows={1}
          placeholder="例如：一个部署在 AWS 上的三层电商系统，前面有 CloudFront 和 ALB，后端 ECS + RDS…"
          className="scrollbar-thin min-h-11 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-primary-foreground outline-none transition-colors placeholder:text-primary-foreground/40 focus:border-white/25 focus:bg-white/[0.09] [field-sizing:content] max-h-40"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || isLaunching}
          className="h-11 shrink-0 rounded-xl bg-card px-5 text-sm font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isLaunching ? '创建中…' : '生成项目'}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map(example => (
          <button
            key={example.label}
            type="button"
            onClick={() => setPrompt(example.prompt)}
            className="h-8 rounded-full border border-white/15 px-3.5 text-[13px] text-primary-foreground/85 transition-colors hover:border-white/30 hover:bg-white/[0.06]"
          >
            {example.label}
          </button>
        ))}
      </div>
    </section>
  );
}
