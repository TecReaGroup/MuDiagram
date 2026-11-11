import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import { brotliCompress, constants as zlibConstants, gzip } from 'node:zlib';
import { CACHE_CONTROL, staticContentTypes } from '../config/constants.mjs';
import { paths } from '../config/paths.mjs';
import { log } from '../infrastructure/logger.mjs';

// draw.io ships ~10 MB of uncompressed JavaScript; brotli cuts it to about a fifth, gzip to a quarter.
const COMPRESSIBLE_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.map', '.svg', '.txt', '.xml']);
// Quality 11 takes many seconds on app.min.js; 9 is close in size at a fraction of the time.
const BROTLI_QUALITY = 9;
// Compressed bytes kept in memory; draw.io's startup files need about 4 MB of it.
const COMPRESSED_CACHE_MAX_BYTES = 64 * 1024 * 1024;

const COMPRESSORS = {
  br: content => promisify(brotliCompress)(content, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
      [zlibConstants.BROTLI_PARAM_SIZE_HINT]: content.length,
    },
  }),
  gzip: content => promisify(gzip)(content, { level: zlibConstants.Z_BEST_COMPRESSION }),
};

/**
 * Compressing on every request cost hundreds of ms of CPU per draw.io load; each file is compressed
 * once per (encoding, version) instead. Entries hold promises so concurrent requests share one job.
 * Map order is insertion order, which makes eviction oldest-first.
 */
const compressedFiles = new Map();
let compressedCacheBytes = 0;

/** Weak validator from size + mtime: files only change on rebuild or a draw.io version bump. */
function toEtag(fileStats) {
  return `W/"${fileStats.size.toString(16)}-${Math.floor(fileStats.mtimeMs).toString(16)}"`;
}

function pickEncoding(acceptEncoding = '') {
  if (/\bbr\b/.test(acceptEncoding)) return 'br';
  if (/\bgzip\b/.test(acceptEncoding)) return 'gzip';
  return null;
}

function evictCompressed(key) {
  const entry = compressedFiles.get(key);
  compressedFiles.delete(key);
  compressedCacheBytes -= entry?.size ?? 0;
}

async function readCompressed(filePath, etag, encoding) {
  const key = `${encoding}:${filePath}`;
  const cached = compressedFiles.get(key);
  if (cached?.etag === etag) return cached.content;
  if (cached) evictCompressed(key);

  const entry = { etag, size: 0, content: null };
  entry.content = readFile(filePath).then(COMPRESSORS[encoding]).then(
    compressed => {
      // A newer version of the file replaced this entry while it was being compressed.
      if (compressedFiles.get(key) !== entry) return compressed;
      entry.size = compressed.length;
      compressedCacheBytes += compressed.length;
      for (const oldestKey of compressedFiles.keys()) {
        if (compressedCacheBytes <= COMPRESSED_CACHE_MAX_BYTES || oldestKey === key) break;
        evictCompressed(oldestKey);
      }
      return compressed;
    },
    error => {
      compressedFiles.delete(key);
      throw error;
    },
  );
  compressedFiles.set(key, entry);
  const startedAt = Date.now();
  const compressed = await entry.content;
  log('debug', 'Static', 'File compressed and cached', { filePath, encoding, size: compressed.length, durationMs: Date.now() - startedAt });
  return compressed;
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
    'Cache-Control': pathname.startsWith('/assets/') ? CACHE_CONTROL.immutable : CACHE_CONTROL.revalidate,
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
  const encoding = COMPRESSIBLE_EXTENSIONS.has(extension) ? pickEncoding(request.headers['accept-encoding']) : null;
  if (encoding) {
    const compressed = await readCompressed(filePath, etag, encoding);
    response.writeHead(200, { ...cacheHeaders, 'Content-Type': contentType, 'Content-Encoding': encoding, 'Content-Length': compressed.length });
    response.end(compressed);
    return true;
  }
  response.writeHead(200, { ...cacheHeaders, 'Content-Type': contentType, 'Content-Length': fileStats.size });
  await pipeline(createReadStream(filePath), response);
  return true;
}
