export class ApiError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Fetches a JSON endpoint and surfaces the server's `{ error }` message on failure. */
export async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(response.status, body?.error ?? `Request failed with ${response.status}`);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
