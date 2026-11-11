import { useEffect, useState, type ChangeEvent } from 'react';
import { requestJson } from '../../shared/api/request-json';
import { useI18n } from '../../shared/i18n/language-context';
import { log, serializeError } from '../../shared/lib/logger';
import { FIELD_INPUT_CLASS as BASE_FIELD_INPUT_CLASS } from '../../shared/ui/control-class';
import { FormField } from '../../shared/ui/FormField';

const MODULE = 'AiModelSetting';
const SETTING_API = '/api/setting';
const MODEL_PLACEHOLDER = 'gpt-6-astra';
const API_KEY_ENV_PLACEHOLDER = 'AI_API_KEY';

const FIELD_INPUT_CLASS = `${BASE_FIELD_INPUT_CLASS} font-mono`;

type AiModelSetting = { model: string; baseUrl: string; apiKeyEnv: string };

const EMPTY_AI_MODEL_SETTING: AiModelSetting = { model: '', baseUrl: '', apiKeyEnv: '' };

/** Saves when a field loses focus, so typing never fires a request per keystroke. */
export function AiModelSettingsSection() {
  const { t } = useI18n();
  const [aiSetting, setAiSetting] = useState<AiModelSetting | null>(null);
  const [savedAiSetting, setSavedAiSetting] = useState<AiModelSetting | null>(null);

  useEffect(() => {
    requestJson<{ ai?: AiModelSetting }>(SETTING_API)
      .then(setting => {
        const loaded = { ...EMPTY_AI_MODEL_SETTING, ...setting.ai };
        setAiSetting(loaded);
        setSavedAiSetting(loaded);
      })
      .catch(error => log('error', MODULE, 'Load AI model setting failed', serializeError(error)));
  }, []);

  if (!aiSetting) return null;

  const updateField = (event: ChangeEvent<HTMLInputElement>) =>
    setAiSetting({ ...aiSetting, [event.target.name]: event.target.value });

  const saveAiSetting = () => {
    if (JSON.stringify(aiSetting) === JSON.stringify(savedAiSetting)) return;
    requestJson(SETTING_API, { method: 'PATCH', body: JSON.stringify({ ai: aiSetting }) })
      .then(() => {
        setSavedAiSetting(aiSetting);
        log('info', MODULE, 'AI model setting saved', { model: aiSetting.model });
      })
      .catch(error => log('error', MODULE, 'Save AI model setting failed', serializeError(error)));
  };

  const fieldProps = { onChange: updateField, onBlur: saveAiSetting, className: FIELD_INPUT_CLASS };

  return (
    <div className="space-y-5">
      <FormField label={t('settings.ai.model')}>
        <input name="model" value={aiSetting.model} placeholder={MODEL_PLACEHOLDER} {...fieldProps} />
      </FormField>
      <FormField label="Base URL">
        <input name="baseUrl" type="url" value={aiSetting.baseUrl} placeholder="https://api.example.com/v1" {...fieldProps} />
      </FormField>
      <FormField label={t('settings.ai.apiKeyEnv')}>
        <input name="apiKeyEnv" value={aiSetting.apiKeyEnv} placeholder={API_KEY_ENV_PLACEHOLDER} {...fieldProps} />
      </FormField>
    </div>
  );
}
