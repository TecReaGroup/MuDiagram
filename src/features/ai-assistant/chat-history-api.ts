import { requestJson } from '../../shared/api/request-json';
import type { DiagramChatMessage } from './diagram-chat-session';

export type ChatSummary = { id: string; title: string; updatedAt: string };

/** Tool call id → the mxfile xml the canvas showed right after that call was applied. */
export type DiagramCheckpoints = Record<string, string>;

export type ChatContent = { title: string; messages: DiagramChatMessage[]; checkpoints: DiagramCheckpoints };

export type SavedChat = ChatSummary & ChatContent;

const chatApi = (projectId: string) => `/api/project/${projectId}/chat`;

export const listChats = (projectId: string) => requestJson<ChatSummary[]>(chatApi(projectId));

export const getChat = (projectId: string, chatId: string) => requestJson<SavedChat>(`${chatApi(projectId)}/${chatId}`);

export const saveChat = (projectId: string, chatId: string, content: ChatContent) =>
  requestJson<ChatSummary>(`${chatApi(projectId)}/${chatId}`, { method: 'PUT', body: JSON.stringify(content) });

export const deleteChat = (projectId: string, chatId: string) =>
  requestJson<void>(`${chatApi(projectId)}/${chatId}`, { method: 'DELETE' });
