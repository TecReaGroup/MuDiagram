import { Check } from 'lucide-react';
import { useState } from 'react';

// Mirrors the [ui] section of config/config.toml until a settings API exists.
const LANGUAGES = [
  { id: 'zh-CN', label: '简体中文', description: 'Chinese (Simplified)' },
  { id: 'en-US', label: 'English', description: '英语' },
] as const;

type LanguageId = (typeof LANGUAGES)[number]['id'];

export function LanguageSettingsSection() {
  const [language, setLanguage] = useState<LanguageId>('zh-CN');

  return (
    <div role="radiogroup" aria-label="界面语言" className="space-y-2.5">
      {LANGUAGES.map(option => {
        const isSelected = option.id === language;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setLanguage(option.id)}
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
  );
}
