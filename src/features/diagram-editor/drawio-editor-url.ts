// Served from our own origin (script/fetch-drawio.mjs) so the selection can be read; react-drawio needs an absolute URL.
export const EDITOR_BASE_URL = new URL('/drawio/index.html', window.location.origin).href;
