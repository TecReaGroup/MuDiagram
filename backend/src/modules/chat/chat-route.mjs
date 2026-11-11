import { log } from '../../infrastructure/logger.mjs';
import { HttpError } from '../../shared/http-error.mjs';
import { readJsonBody, sendJson, sendNoContent } from '../../shared/http.mjs';
import { deleteChat, listChats, readChat, saveChat } from './chat-store.mjs';

const MAX_CHAT_TITLE_LENGTH = 120;
const CHAT_LIST_PATH = '/api/project/(?<projectId>[0-9a-f-]{36})/chat';
// The chat id becomes a file name, so the pattern also keeps paths inside the chat directory.
const CHAT_PATH = `${CHAT_LIST_PATH}/(?<chatId>[0-9a-f-]{36})`;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readChatContent(body) {
  if (typeof body?.title !== 'string') throw new HttpError(400, 'title must be a string');
  if (!Array.isArray(body.messages)) throw new HttpError(400, 'messages must be an array');
  if (!isPlainObject(body.checkpoints) || !Object.values(body.checkpoints).every(xml => typeof xml === 'string')) {
    throw new HttpError(400, 'checkpoints must map tool call ids to diagram xml');
  }
  return {
    title: body.title.trim().slice(0, MAX_CHAT_TITLE_LENGTH),
    messages: body.messages,
    checkpoints: body.checkpoints,
  };
}

export const chatRoutes = [
  {
    method: 'GET',
    path: new RegExp(`^${CHAT_LIST_PATH}$`),
    handle: async (request, response, { projectId }) => sendJson(response, 200, await listChats(projectId)),
  },
  {
    method: 'GET',
    path: new RegExp(`^${CHAT_PATH}$`),
    handle: async (request, response, { projectId, chatId }) => sendJson(response, 200, await readChat(projectId, chatId)),
  },
  {
    method: 'PUT',
    path: new RegExp(`^${CHAT_PATH}$`),
    handle: async (request, response, { projectId, chatId }) => {
      const chatContent = readChatContent(await readJsonBody(request));
      const chatSummary = await saveChat(projectId, chatId, chatContent);
      log('debug', 'Chat', 'Chat saved', {
        projectId,
        chatId,
        messageCount: chatContent.messages.length,
        checkpointCount: Object.keys(chatContent.checkpoints).length,
      });
      sendJson(response, 200, chatSummary);
    },
  },
  {
    method: 'DELETE',
    path: new RegExp(`^${CHAT_PATH}$`),
    handle: async (request, response, { projectId, chatId }) => {
      await deleteChat(projectId, chatId);
      log('info', 'Chat', 'Chat deleted', { projectId, chatId });
      sendNoContent(response);
    },
  },
];
