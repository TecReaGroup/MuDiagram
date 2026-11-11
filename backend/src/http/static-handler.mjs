import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';
import { staticContentTypes } from '../config/constants.mjs';
import { paths } from '../config/paths.mjs';

// draw.io ships ~10 MB of uncompressed JavaScript; gzip cuts it to about a quarter.
const COMPRESSIBLE_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.map', '.svg', '.txt', '.xml']);

/** Weak validator from size + mtime: files only change on rebuild or a draw.io version bump. */
function toEtag(fileStats) {
  return `W/"${fileStats.size.toString(16)}-${Math.floor(fileStats.mtimeMs).toString(16)}"`;
}

export async function streamFrontend(request, response, pathname) {
  const requestedPath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const filePath = resolve(paths.distRoot, requestedPath);
  const relativePath = relative(paths.distRoot, filePath);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) return false;

  let fileStats;
  try {
    fileStats = await stat(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
  if (!fileStats.isFile()) return false;

  const extension = extname(filePath).toLowerCase();
  const etag = toEtag(fileStats);
  // Unhashed files (index.html, /drawio/*) are revalidated on every use, which costs a 304, not a download.
  const cacheHeaders = {
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    ETag: etag,
    'Last-Modified': fileStats.mtime.toUTCString(),
    Vary: 'Accept-Encoding',
  };
  if (request.headers['if-none-match'] === etag) {
    response.writeHead(304, cacheHeaders);
    response.end();
    return true;
  }

  const contentType = staticContentTypes[extension] ?? 'application/octet-stream';
  const acceptsGzip = /\bgzip\b/.test(request.headers['accept-encoding'] ?? '');
  if (acceptsGzip && COMPRESSIBLE_EXTENSIONS.has(extension)) {
    response.writeHead(200, { ...cacheHeaders, 'Content-Type': contentType, 'Content-Encoding': 'gzip' });
    await pipeline(createReadStream(filePath), createGzip(), response);
    return true;
  }
  response.writeHead(200, { ...cacheHeaders, 'Content-Type': contentType, 'Content-Length': fileStats.size });
  await pipeline(createReadStream(filePath), response);
  return true;
}
