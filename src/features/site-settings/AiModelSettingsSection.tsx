import type { ReactNode } from 'react';
import { useI18n } from '../../shared/i18n/language-context';
import { FIELD_FOCUS_CLASS } from '../../shared/ui/control-class';

const MODEL_PLACEHOLDER = 'gpt-6-astra';
const API_KEY_ENV_PLACEHOLDER = 'AI_API_KEY';

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
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <SettingsField label={t('settings.ai.model')}>
        <input name="model" placeholder={MODEL_PLACEHOLDER} className={FIELD_INPUT_CLASS} />
      </SettingsField>
      <SettingsField label="Base URL">
        <input name="baseUrl" type="url" placeholder="https://api.example.com/v1" className={FIELD_INPUT_CLASS} />
      </SettingsField>
      <SettingsField label={t('settings.ai.apiKeyEnv')}>
        <input name="apiKeyEnv" placeholder={API_KEY_ENV_PLACEHOLDER} className={FIELD_INPUT_CLASS} />
      </SettingsField>
    </div>
  );
}
