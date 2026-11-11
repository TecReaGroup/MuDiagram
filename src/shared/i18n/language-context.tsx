import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { requestJson } from '../api/request-json';
import { log, serializeError } from '../lib/logger';
import { FALLBACK_LANGUAGE, LANGUAGES, MESSAGES, type Language, type MessageKey } from './message';

const MODULE = 'I18n';
const SETTING_API = '/api/setting';
const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export type I18n = {
  language: Language;
  t: Translate;
  /** Applies the language at once and saves it; reverts if saving fails. */
  changeLanguage: (language: Language) => void;
};

const I18nContext = createContext<I18n | null>(null);

/** First system language we support, matched exactly, then by primary subtag (e.g. "zh-TW" → "zh-CN"). */
function detectSystemLanguage(): Language {
  for (const systemLanguage of navigator.languages) {
    const exactMatch = LANGUAGES.find(language => language.toLowerCase() === systemLanguage.toLowerCase());
    if (exactMatch) return exactMatch;
    const primarySubtag = systemLanguage.split('-')[0].toLowerCase();
    const subtagMatch = LANGUAGES.find(language => language.split('-')[0] === primarySubtag);
    if (subtagMatch) return subtagMatch;
  }
  return FALLBACK_LANGUAGE;
}

/** Loads the saved language before rendering, so the UI never flashes in the wrong language. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language | null>(null);

  useEffect(() => {
    requestJson<{ language?: Language }>(SETTING_API)
      .then(setting => setLanguage(setting.language ?? detectSystemLanguage()))
      .catch(error => {
        log('error', MODULE, 'Load language failed', serializeError(error));
        setLanguage(detectSystemLanguage());
      });
  }, []);

  useEffect(() => {
    if (language) document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = useCallback((nextLanguage: Language) => {
    const previousLanguage = language;
    setLanguage(nextLanguage);
    requestJson(SETTING_API, { method: 'PATCH', body: JSON.stringify({ language: nextLanguage }) })
      .then(() => log('info', MODULE, 'Language saved', { language: nextLanguage }))
      .catch(error => {
        log('error', MODULE, 'Save language failed', serializeError(error));
        setLanguage(previousLanguage);
      });
  }, [language]);

  const i18n = useMemo<I18n | null>(() => {
    if (!language) return null;
    const messages = MESSAGES[language];
    const t: Translate = (key, params = {}) =>
      messages[key].replace(PLACEHOLDER_PATTERN, (placeholder, name: string) => String(params[name] ?? placeholder));
    return { language, t, changeLanguage };
  }, [language, changeLanguage]);

  return i18n && <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error('useI18n must be used inside <LanguageProvider>');
  return i18n;
}
