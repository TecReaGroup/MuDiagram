import { useI18n } from '../../shared/i18n/language-context';
import { FIELD_INPUT_CLASS as BASE_FIELD_INPUT_CLASS } from '../../shared/ui/control-class';
import { FormField } from '../../shared/ui/FormField';

const MODEL_PLACEHOLDER = 'gpt-6-astra';
const API_KEY_ENV_PLACEHOLDER = 'AI_API_KEY';

const FIELD_INPUT_CLASS = `${BASE_FIELD_INPUT_CLASS} font-mono`;

export function AiModelSettingsSection() {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <FormField label={t('settings.ai.model')}>
        <input name="model" placeholder={MODEL_PLACEHOLDER} className={FIELD_INPUT_CLASS} />
      </FormField>
      <FormField label="Base URL">
        <input name="baseUrl" type="url" placeholder="https://api.example.com/v1" className={FIELD_INPUT_CLASS} />
      </FormField>
      <FormField label={t('settings.ai.apiKeyEnv')}>
        <input name="apiKeyEnv" placeholder={API_KEY_ENV_PLACEHOLDER} className={FIELD_INPUT_CLASS} />
      </FormField>
    </div>
  );
}
