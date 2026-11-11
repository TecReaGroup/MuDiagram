type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogFields = Record<string, string | number | boolean | null | undefined>;

const LOG_UTC_OFFSET_MINUTES = 8 * 60;
const LOG_UTC_OFFSET_LABEL = '+08:00';

function formatLogTimestamp(date: Date): string {
  const shifted = new Date(date.getTime() + LOG_UTC_OFFSET_MINUTES * 60_000);
  return `${shifted.toISOString().slice(0, 19).replace('T', ' ')} ${LOG_UTC_OFFSET_LABEL}`;
}

export function serializeError(error: unknown): LogFields {
  if (!(error instanceof Error)) return { message: String(error) };
  return {
    name: error.name,
    message: error.message,
    statusCode: (error as Error & { statusCode?: number }).statusCode,
  };
}

// Browser logs go to the console only; persistent ./log files are written by the backend.
export function log(level: LogLevel, module: string, message: string, fields: LogFields = {}) {
  console[level](`[${formatLogTimestamp(new Date())}] [${level.toUpperCase()}] [${module}] - ${message}`, fields);
}
