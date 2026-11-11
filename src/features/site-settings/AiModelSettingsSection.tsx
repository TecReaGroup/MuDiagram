import { Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { buttonClass, FIELD_FOCUS_CLASS } from '../../shared/ui/control-class';

// Mirrors the [ai] section of config/config.toml until a settings API exists.
const AI_PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic', description: 'Claude 系列模型，使用官方 Messages API' },
  { id: 'openai', label: 'OpenAI 兼容', description: '支持 OpenAI、DeepSeek、OpenRouter、Ollama 等' },
] as const;
const DEFAULT_MODEL = 'claude-sonnet-5-5';
const DEFAULT_API_KEY_ENV = 'AI_API_KEY';
const DEFAULT_MAX_OUTPUT_TOKENS = 16000;

type AiProviderId = (typeof AI_PROVIDERS)[number]['id'];

const FIELD_INPUT_CLASS = `h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none placeholder:text-ink-faint hover:border-line-strong ${FIELD_FOCUS_CLASS}`;

function SettingsField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function AiModelSettingsSection() {
  const [provider, setProvider] = useState<AiProviderId>('anthropic');

  return (
    <form method="dialog" className="space-y-7">
      <div role="radiogroup" aria-label="模型服务商" className="space-y-2.5">
        {AI_PROVIDERS.map(option => {
          const isSelected = option.id === provider;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setProvider(option.id)}
              className={`flex w-full items-center gap-3 rounded-xl border bg-surface px-4 py-3 text-left transition-[border-color,box-shadow] ${isSelected ? 'border-line-strong shadow-card' : 'border-line hover:border-line-strong'}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="block text-xs text-ink-muted">{option.description}</span>
              </span>
              {isSelected && <Check className="size-4 shrink-0 text-ink" />}
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        <SettingsField label="模型">
          <input name="model" defaultValue={DEFAULT_MODEL} className={`${FIELD_INPUT_CLASS} font-mono text-[13px]`} />
        </SettingsField>
        <SettingsField label="Base URL" hint="留空则使用服务商的官方地址">
          <input name="baseUrl" type="url" placeholder="https://api.example.com/v1" className={`${FIELD_INPUT_CLASS} font-mono text-[13px]`} />
        </SettingsField>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SettingsField label="API Key 环境变量" hint="密钥本身只保存在服务器环境变量中">
            <input name="apiKeyEnv" defaultValue={DEFAULT_API_KEY_ENV} className={`${FIELD_INPUT_CLASS} font-mono text-[13px]`} />
          </SettingsField>
          <SettingsField label="最大输出 Token" hint="单次回复可生成的上限">
            <input name="maxOutputTokens" type="number" min={1} step={1000} defaultValue={DEFAULT_MAX_OUTPUT_TOKENS} className={`${FIELD_INPUT_CLASS} tabular-nums`} />
          </SettingsField>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" value="save" className={buttonClass('primary', 'lg')}>保存更改</button>
      </div>
    </form>
  );
}
