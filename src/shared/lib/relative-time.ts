import type { I18n } from '../i18n/language-context';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "just now", "5 minutes ago", "today at 10:24", "yesterday", or a date; lowercase so it can sit mid-sentence. */
export function formatRelativeTime(isoTime: string, { language, t }: Pick<I18n, 'language' | 't'>, now = new Date()): string {
  const time = new Date(isoTime);
  const elapsedMs = now.getTime() - time.getTime();
  const relativeTimeFormat = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  if (elapsedMs < MINUTE_MS) return t('time.justNow');
  if (elapsedMs < HOUR_MS) return relativeTimeFormat.format(-Math.floor(elapsedMs / MINUTE_MS), 'minute');

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (time.getTime() >= startOfToday) {
    return t('time.today', { time: time.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }) });
  }
  if (time.getTime() >= startOfToday - DAY_MS) return relativeTimeFormat.format(-1, 'day');
  return time.toLocaleDateString(language, {
    year: time.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  });
}