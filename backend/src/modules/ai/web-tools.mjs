import { openai } from '@ai-sdk/openai';

export const WEB_TOOL_INSTRUCTIONS = `

## Web access
- web_search searches the web and its results come back to you, so keep working after it.
- Use it when the request depends on facts you may not know or that may be outdated, or when the user gives a URL. Do not search for things you already know well.
- Search first, then draw in a single diagram tool call. Mention the sources you relied on by URL.`;

/** OpenAI built-in search: it runs inside the Responses API, so the server only declares it. */
export const webTools = { web_search: openai.tools.webSearch() };
