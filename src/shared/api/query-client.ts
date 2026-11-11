import { QueryCache, QueryClient } from '@tanstack/react-query';
import { log, serializeError } from '../lib/logger';

// Server data shown again within this window is served from memory without a refetch.
const DEFAULT_STALE_TIME_MS = 30_000;
// Unused cached data is kept this long, so returning to a page renders instantly.
const DEFAULT_GC_TIME_MS = 10 * 60_000;

/** The one cache for server state; every GET that pages share goes through it. */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => log('error', 'QueryCache', 'Query failed', { queryKey: JSON.stringify(query.queryKey), ...serializeError(error) }),
  }),
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      gcTime: DEFAULT_GC_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
