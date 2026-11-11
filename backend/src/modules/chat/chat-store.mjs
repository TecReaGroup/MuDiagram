import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { HttpError } from '../../shared/http-error.mjs';
import { getProject, projectDirectory, writeFileAtomically } from '../project/project-store.mjs';

// Inside the project folder, so trashing and purging a project take its chats along.
const CHAT_DIRECTORY = 'chat';
const CHAT_FILE_EXTENSION = '.json';

function chatDirectory(projectId) {
  return join(projectDirectory(projectId), CHAT_DIRECTORY);
}

function chatFile(projectId, chatId) {
  return join(chatDirectory(projectId), `${chatId}${CHAT_FILE_EXTENSION}`);
}

const toChatSummary = ({ id, title, updatedAt }) => ({ id, title, updatedAt });

/** The project's chats, most recently updated first, without their messages. */
export async function listChats(projectId) {
  await getProject(projectId);
  let fileNames;
  try {
    fileNames = await readdir(chatDirectory(projectId));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const chats = await Promise.all(fileNames
    .filter(fileName => fileName.endsWith(CHAT_FILE_EXTENSION))
    .map(async fileName => JSON.parse(await readFile(join(chatDirectory(projectId), fileName), 'utf8'))));
  return chats.map(toChatSummary).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function readChat(projectId, chatId) {
  try {
    return JSON.parse(await readFile(chatFile(projectId, chatId), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new HttpError(404, 'Chat not found');
    throw error;
  }
}

/**
 * Creates or replaces a chat; the browser owns its content and sends it whole.
 *
 * Args:
 *     chat: `{ title, messages, checkpoints }`, where `checkpoints` maps a tool call id to the
 *         mxfile xml the canvas showed right after that call was applied.
 */
export async function saveChat(projectId, chatId, { title, messages, checkpoints }) {
  await getProject(projectId);
  const chat = { id: chatId, title, updatedAt: new Date().toISOString(), messages, checkpoints };
  await mkdir(chatDirectory(projectId), { recursive: true });
  await writeFileAtomically(chatFile(projectId, chatId), JSON.stringify(chat));
  return toChatSummary(chat);
}

export async function deleteChat(projectId, chatId) {
  try {
    await rm(chatFile(projectId, chatId));
  } catch (error) {
    if (error?.code === 'ENOENT') throw new HttpError(404, 'Chat not found');
    throw error;
  }
}
