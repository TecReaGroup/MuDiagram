export const staticContentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

/** Every Cache-Control value the server sends, so caching rules are decided in one place. */
export const CACHE_CONTROL = {
  // Content-hashed build output and URLs carrying a version (`?v=`): the bytes behind them never change.
  immutable: 'public, max-age=31536000, immutable',
  privateImmutable: 'private, max-age=31536000, immutable',
  // Stable URLs whose content can change: reuse after a cheap 304 revalidation.
  revalidate: 'no-cache',
  // API responses reflect live state.
  none: 'no-store',
};
