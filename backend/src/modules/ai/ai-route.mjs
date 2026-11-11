import {
  convertToModelMessages,
  pipeUIMessageStreamToResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from 'ai';
import { appConfig } from '../../config/app-config.mjs';
import { log, serializeError } from '../../infrastructure/logger.mjs';
import { HttpError } from '../../shared/http-error.mjs';
import { readJsonBody } from '../../shared/http.mjs';
import { diagramTools } from './diagram-tools.mjs';
import { createLanguageModel } from './language-model.mjs';
import { buildDiagramInstructions } from './system-prompt.mjs';

async function readChatRequest(request) {
  const body = await readJsonBody(request);
  if (typeof body?.xml !== 'string') throw new HttpError(400, 'xml must be the current diagram XML');
  try {
    return { messages: await validateUIMessages({ messages: body.messages, tools: diagramTools }), xml: body.xml };
  } catch {
    throw new HttpError(400, 'messages must be valid UI messages');
  }
}

export const aiRoutes = [
  {
    method: 'POST',
    path: new RegExp('^/api/ai/chat$'),
    handle: async (request, response) => {
      const { messages, xml } = await readChatRequest(request);
      const model = createLanguageModel();
      const abortController = new AbortController();
      response.on('close', () => {
        if (!response.writableFinished) abortController.abort();
      });

      const startedAt = Date.now();
      const chatStream = streamText({
        model,
        instructions: buildDiagramInstructions(xml),
        messages: await convertToModelMessages(messages),
        tools: diagramTools,
        maxOutputTokens: appConfig.ai.maxOutputTokens,
        abortSignal: abortController.signal,
        onError: ({ error }) => log('error', 'AI', 'Chat stream failed', { error: serializeError(error) }),
        onFinish: ({ finishReason, totalUsage }) => log('info', 'AI', 'Chat turn finished', {
          model: appConfig.ai.model,
          finishReason,
          outputTokens: totalUsage?.outputTokens,
          durationMs: Date.now() - startedAt,
        }),
      });

      pipeUIMessageStreamToResponse({
        response,
        stream: toUIMessageStream({ stream: chatStream.stream, originalMessages: messages }),
      });
    },
  },
];
