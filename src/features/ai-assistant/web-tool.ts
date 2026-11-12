// Mirrors the OpenAI built-in search declared in backend/src/modules/ai/web-tools.mjs; the browser only
// shows that it ran, so its output stays opaque.
export type WebChatTools = {
  web_search: { input: Record<string, never>; output: unknown };
};
