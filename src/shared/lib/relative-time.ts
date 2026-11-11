const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "刚刚", "5 分钟前", "今天 10:24", "昨天", or a date for anything older. */
export function formatRelativeTime(isoTime: string, now = new Date()): string {
  const time = new Date(isoTime);
  const elapsedMs = now.getTime() - time.getTime();
  if (elapsedMs < MINUTE_MS) return '刚刚';
  if (elapsedMs < HOUR_MS) return RELATIVE_TIME_FORMAT.format(-Math.floor(elapsedMs / MINUTE_MS), 'minute');

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (time.getTime() >= startOfToday) {
    return `今天 ${time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (time.getTime() >= startOfToday - DAY_MS) return '昨天';
  return time.toLocaleDateString('zh-CN', {
    year: time.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
