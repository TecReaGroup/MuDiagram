export class ApiError extends Error {
  constructor(readonly statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return new ApiError(response.status, body?.error ?? `Request failed with ${response.status}`);
}

/** Fetches a JSON endpoint and surfaces the server's `{ error }` message on failure. */
export async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  });
  if (!response.ok) throw await readApiError(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
}

/** A `fetch` that rejects with the server's `{ error }` message, for clients that take a fetch function. */
export const fetchOrThrowApiError: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (!response.ok) throw await readApiError(response);
  return response;
};
