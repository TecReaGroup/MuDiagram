import {
  convertToModelMessages,
  generateText,
  pipeUIMessageStreamToResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from 'ai';
import { log, serializeError } from '../../infrastructure/logger.mjs';
import { HttpError } from '../../shared/http-error.mjs';
import { readJsonBody, sendJson } from '../../shared/http.mjs';
import { readAiSetting } from '../setting/ai-setting.mjs';
import { readSetting } from '../setting/setting-store.mjs';
import { diagramTools } from './diagram-tools.mjs';
import { buildLanguageModel } from './language-model.mjs';
import { buildDiagramInstructions } from './system-prompt.mjs';
import { WEB_TOOL_INSTRUCTIONS, webTools } from './web-tools.mjs';

const MODEL_TEST_TIMEOUT_MS = 30_000;
const MODEL_TEST_PROMPT = 'Reply with OK.';

function isSelectedCell(cell) {
  return typeof cell?.id === 'string' && typeof cell?.label === 'string';
}

/** The selection pinned to the latest user message; tool round-trips after it must not change it. */
function readLatestSelection(messages) {
  const selectedCells = messages.findLast(message => message.role === 'user')?.metadata?.selectedCells ?? [];
  if (!Array.isArray(selectedCells) || !selectedCells.every(isSelectedCell)) {
    throw new HttpError(400, 'metadata.selectedCells must be an array of { id, label }');
  }
  return selectedCells;
}

function buildChatTooling(aiSetting) {
  if (!aiSetting.nativeWebSearch) return { tools: diagramTools, extraInstructions: '' };
  return { tools: { ...diagramTools, ...webTools }, extraInstructions: WEB_TOOL_INSTRUCTIONS };
}

async function readChatRequest(request, tools) {
  const body = await readJsonBody(request);
  if (typeof body?.xml !== 'string') throw new HttpError(400, 'xml must be the current diagram XML');
  let messages;
  try {
    messages = await validateUIMessages({ messages: body.messages, tools });
  } catch {
    throw new HttpError(400, 'messages must be valid UI messages');
  }
  return { messages, xml: body.xml, selectedCells: readLatestSelection(messages) };
}

/** Sends one tiny prompt with the unsaved form values, so a setting can be checked before it is relied on. */
async function testLanguageModel(request, response) {
  const model = buildLanguageModel(readAiSetting(await readJsonBody(request)));
  const startedAt = Date.now();
  try {
    await generateText({ model, prompt: MODEL_TEST_PROMPT, abortSignal: AbortSignal.timeout(MODEL_TEST_TIMEOUT_MS) });
  } catch (error) {
    log('warn', 'AI', 'Model test failed', { model: model.modelId, error: serializeError(error) });
    throw new HttpError(502, error instanceof Error ? error.message : String(error));
  }
  const latencyMs = Date.now() - startedAt;
  log('info', 'AI', 'Model test passed', { model: model.modelId, latencyMs });
  sendJson(response, 200, { latencyMs });
}

export const aiRoutes = [
  {
    method: 'POST',
    path: new RegExp('^/api/ai/test$'),
    handle: testLanguageModel,
  },
  {
    method: 'POST',
    path: new RegExp('^/api/ai/chat$'),
    handle: async (request, response) => {
      const aiSetting = (await readSetting()).ai ?? {};
      const model = buildLanguageModel(aiSetting);
      const { tools, extraInstructions } = buildChatTooling(aiSetting);
      const { messages, xml, selectedCells } = await readChatRequest(request, tools);
      const abortController = new AbortController();
      response.on('close', () => {
        if (!response.writableFinished) abortController.abort();
      });

      const startedAt = Date.now();
      const chatStream = streamText({
        model,
        instructions: buildDiagramInstructions(xml, selectedCells) + extraInstructions,
        messages: await convertToModelMessages(messages),
        tools,
        abortSignal: abortController.signal,
        onError: ({ error }) => log('error', 'AI', 'Chat stream failed', { error: serializeError(error) }),
        onFinish: ({ finishReason, totalUsage }) => log('info', 'AI', 'Chat turn finished', {
          model: model.modelId,
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
