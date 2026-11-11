import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { log, serializeError } from '../infrastructure/logger.mjs';
import { aiRoutes } from '../modules/ai/ai-route.mjs';
import { folderRoutes } from '../modules/folder/folder-route.mjs';
import { projectRoutes } from '../modules/project/project-route.mjs';
import { trashRoutes } from '../modules/project/trash-route.mjs';
import { shareRoutes } from '../modules/share/share-route.mjs';
import { HttpError } from '../shared/http-error.mjs';
import { sendJson } from '../shared/http.mjs';
import { streamFrontend } from './static-handler.mjs';

const API_ROUTES = [...projectRoutes, ...trashRoutes, ...folderRoutes, ...shareRoutes, ...aiRoutes];

function matchApiRoute(method, pathname) {
  for (const route of API_ROUTES) {
    if (route.method !== method) continue;
    const match = route.path.exec(pathname);
    if (match) return { route, params: match.groups ?? {} };
  }
  return null;
}

async function routeRequest(request, response, url) {
  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  const apiMatch = matchApiRoute(request.method, url.pathname);
  if (apiMatch) {
    await apiMatch.route.handle(request, response, apiMatch.params);
    return;
  }

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    sendJson(response, 404, { error: 'Route not found' });
    return;
  }

  if (request.method === 'GET') {
    if (await streamFrontend(response, url.pathname)) return;
    if (!extname(url.pathname) && await streamFrontend(response, '/')) return;
  }

  sendJson(response, 404, { error: 'Route not found' });
}

export async function handleRequest(request, response) {
  const requestId = request.headers['x-request-id']?.toString().slice(0, 128) || randomUUID();
  const startedAt = Date.now();
  response.setHeader('X-Request-Id', requestId);

  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    await routeRequest(request, response, url);
  } catch (error) {
    if (request.aborted || response.destroyed || error?.code === 'ECONNRESET' || error?.code === 'ECONNABORTED') return;
    if (error instanceof HttpError && !response.headersSent) {
      log('warn', 'HTTP', 'Request rejected', {
        requestId,
        method: request.method,
        statusCode: error.statusCode,
        message: error.message,
      });
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }
    log('error', 'HTTP', 'Request failed', {
      requestId,
      method: request.method,
      durationMs: Date.now() - startedAt,
      error: serializeError(error),
    });
    if (response.headersSent) {
      response.destroy();
      return;
    }
    sendJson(response, error instanceof URIError ? 400 : 500, {
      error: error instanceof URIError ? 'Invalid request path' : 'Internal server error',
    });
  }
}
