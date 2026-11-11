import { CACHE_CONTROL } from '../config/constants.mjs';
import { HttpError } from './http-error.mjs';

// Bodies carry the diagram XML plus base64 SVG/PNG snapshots of it.
const MAX_JSON_BODY_BYTES = 30 * 1024 * 1024;
// Served SVGs come from the editor and may carry scripts; render them inert.
const STORED_FILE_POLICY = "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; font-src data: https:; sandbox";

export function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': CACHE_CONTROL.none,
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(JSON.stringify(value));
}

export function sendNoContent(response) {
  response.writeHead(204, { 'Cache-Control': CACHE_CONTROL.none });
  response.end();
}

export function sendFile(response, contentType, content, headers = {}) {
  response.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': content.length,
    'Cache-Control': CACHE_CONTROL.revalidate,
    'Content-Security-Policy': STORED_FILE_POLICY,
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(content);
}

export async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_JSON_BODY_BYTES) throw new HttpError(413, 'Request body too large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Request body is not valid JSON');
  }
}
