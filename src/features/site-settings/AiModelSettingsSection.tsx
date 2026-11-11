import { Sparkle } from 'lucide-react';
import type { ReactNode } from 'react';
import { FIELD_FOCUS_CLASS } from '../../shared/ui/control-class';

// Mirrors the [ai] section of config/config.toml until a settings API exists.
const DEFAULT_MODEL = 'claude-sonnet-5-5';
const DEFAULT_API_KEY_ENV = 'AI_API_KEY';

const FIELD_INPUT_CLASS = `h-10 w-full rounded-xl border border-line bg-surface px-3.5 font-mono text-[13px] text-ink outline-none placeholder:text-ink-faint hover:border-line-strong ${FIELD_FOCUS_CLASS}`;

function SettingsField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-[13px] font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export function AiModelSettingsSection() {
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <Sparkle className="size-4 shrink-0 text-ink" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">OpenAI 兼容</span>
          <span className="block text-xs text-ink-muted">支持 OpenAI、DeepSeek、OpenRouter、Ollama 等</span>
        </span>
      </div>

      <div className="space-y-5">
        <SettingsField label="模型">
          <input name="model" defaultValue={DEFAULT_MODEL} className={FIELD_INPUT_CLASS} />
        </SettingsField>
        <SettingsField label="Base URL">
          <input name="baseUrl" type="url" placeholder="https://api.example.com/v1" className={FIELD_INPUT_CLASS} />
        </SettingsField>
        <SettingsField label="API Key 环境变量">
          <input name="apiKeyEnv" defaultValue={DEFAULT_API_KEY_ENV} className={FIELD_INPUT_CLASS} />
        </SettingsField>
      </div>
    </div>
  );
}
