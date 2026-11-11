import { Check, CircleExclamationPoint, LoaderCircle } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import { requestJson } from '../../shared/api/request-json';
import { useI18n } from '../../shared/i18n/language-context';
import { log, serializeError } from '../../shared/lib/logger';
import { FIELD_INPUT_CLASS as BASE_FIELD_INPUT_CLASS, buttonClass } from '../../shared/ui/control-class';
import { FormField } from '../../shared/ui/FormField';

const MODULE = 'AiModelSetting';
const SETTING_API = '/api/setting';
const MODEL_TEST_API = '/api/ai/test';
const MODEL_PLACEHOLDER = 'gpt-6-astra';
const API_KEY_PLACEHOLDER = 'sk-...';

const FIELD_INPUT_CLASS = `${BASE_FIELD_INPUT_CLASS} font-mono`;

type AiModelSetting = { model: string; baseUrl: string; apiKey: string };

type ModelTestStatus =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'passed'; latencyMs: number }
  | { kind: 'failed'; message: string };

/** Saves when a field loses focus, so typing never fires a request per keystroke. */
export function AiModelSettingsSection() {
  const { t } = useI18n();
  const [form, setForm] = useState<AiModelSetting | null>(null);
  const [savedSetting, setSavedSetting] = useState<AiModelSetting | null>(null);
  const [testStatus, setTestStatus] = useState<ModelTestStatus>({ kind: 'idle' });

  useEffect(() => {
    requestJson<{ ai: AiModelSetting }>(SETTING_API)
      .then(({ ai }) => {
        setForm(ai);
        setSavedSetting(ai);
      })
      .catch(error => log('error', MODULE, 'Load AI model setting failed', serializeError(error)));
  }, []);

  if (!form || !savedSetting) return null;

  const updateField = (event: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setTestStatus({ kind: 'idle' });
  };

  const saveAiSetting = () => {
    if (JSON.stringify(form) === JSON.stringify(savedSetting)) return;
    requestJson<{ ai: AiModelSetting }>(SETTING_API, { method: 'PATCH', body: JSON.stringify({ ai: form }) })
      .then(({ ai }) => {
        setSavedSetting(ai);
        log('info', MODULE, 'AI model setting saved', { model: ai.model });
      })
      .catch(error => log('error', MODULE, 'Save AI model setting failed', serializeError(error)));
  };

  const testModel = () => {
    setTestStatus({ kind: 'testing' });
    requestJson<{ latencyMs: number }>(MODEL_TEST_API, { method: 'POST', body: JSON.stringify(form) })
      .then(({ latencyMs }) => setTestStatus({ kind: 'passed', latencyMs }))
      .catch(error => {
        log('warn', MODULE, 'AI model test failed', serializeError(error));
        setTestStatus({ kind: 'failed', message: error instanceof Error ? error.message : String(error) });
      });
  };

  const fieldProps = { onChange: updateField, onBlur: saveAiSetting, className: FIELD_INPUT_CLASS };

  return (
    <div className="space-y-5">
      <FormField label={t('settings.ai.model')}>
        <input name="model" value={form.model} placeholder={MODEL_PLACEHOLDER} {...fieldProps} />
      </FormField>
      <FormField label="Base URL">
        <input name="baseUrl" type="url" value={form.baseUrl} placeholder="https://api.example.com/v1" {...fieldProps} />
      </FormField>
      <FormField label="API Key">
        <input name="apiKey" autoComplete="off" spellCheck={false} value={form.apiKey} placeholder={API_KEY_PLACEHOLDER} {...fieldProps} />
      </FormField>
      <div className="flex items-center gap-3">
        <button type="button" className={buttonClass('secondary')} disabled={testStatus.kind === 'testing'} onClick={testModel}>
          {testStatus.kind === 'testing' && <LoaderCircle className="animate-spin" />}
          {t('settings.ai.test')}
        </button>
        <ModelTestMessage status={testStatus} />
      </div>
    </div>
  );
}

function ModelTestMessage({ status }: { status: ModelTestStatus }) {
  const { t } = useI18n();
  if (status.kind === 'passed') {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-success">
        <Check className="size-4 shrink-0" />
        {t('settings.ai.testPassed', { latencyMs: status.latencyMs })}
      </p>
    );
  }
  if (status.kind === 'failed') {
    return (
      <p className="flex min-w-0 items-center gap-1.5 text-[13px] text-danger" title={status.message}>
        <CircleExclamationPoint className="size-4 shrink-0" />
        <span className="truncate">{status.message}</span>
      </p>
    );
  }
  return null;
}
