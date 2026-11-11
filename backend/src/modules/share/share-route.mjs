import { sendFile } from '../../shared/http.mjs';
import { findProjectByShareToken, readDiagramRendition } from '../project/project-store.mjs';

const SHARE_PATH = '/api/share/(?<shareToken>[A-Za-z0-9_-]{32})';
// Shared files are meant to be embedded in other sites (README, wiki, blog).
const SHARED_FILE_HEADERS = { 'Access-Control-Allow-Origin': '*' };

/** Public, read-only routes addressed by share token; they never expose the project id. */
export const shareRoutes = [
  {
    method: 'GET',
    path: new RegExp(`^${SHARE_PATH}/diagram\\.(?<extension>drawio|svg|png)$`),
    handle: async (request, response, { shareToken, extension }) => {
      const project = await findProjectByShareToken(shareToken);
      const { contentType, content } = await readDiagramRendition(project.id, extension);
      const fileName = encodeURIComponent(`${project.name}.${extension}`);
      sendFile(response, contentType, content, {
        ...SHARED_FILE_HEADERS,
        ...(extension === 'drawio' ? { 'Content-Disposition': `attachment; filename*=UTF-8''${fileName}` } : {}),
      });
    },
  },
];
