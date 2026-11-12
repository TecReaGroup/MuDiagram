import { Chat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart, lastAssistantMessageIsCompleteWithToolCalls, type FileUIPart, type UIDataTypes, type UIMessage } from 'ai';
import type { RefObject } from 'react';
import { diagramXmlQuery } from '../../entities/project/project-query';
import { fetchOrThrowApiError } from '../../shared/api/request-json';
import { queryClient } from '../../shared/api/query-client';
import { log, serializeError } from '../../shared/lib/logger';
import type { DiagramCanvasHandle } from '../diagram-editor/DiagramCanvas';
import type { SelectedCell } from '../diagram-editor/drawio-editor-bridge';
import { deleteChat as deleteSavedChat, getChat, listChats, saveChat, type ChatContent, type DiagramCheckpoints, type SavedChat } from './chat-history-api';
import { applyDiagramToolCall, DIAGRAM_TOOL_SUCCESS_OUTPUT, readGraphModelXml, type DiagramChatTools } from './diagram-tool';
import type { WebChatTools } from './web-tool';

const MODULE = 'AiAssistant';
const CHAT_API = '/api/ai/chat';
// A rejected tool call is sent back so the model can fix it; this caps how many rejections one
// turn may burn through before the user has to step in.
const MAX_FAILED_TOOL_CALLS_PER_TURN = 3;
const MAX_CHAT_TITLE_LENGTH = 60;
// Earlier turns sent as text-only context before the latest one.
const MAX_HISTORY_TURNS = 6;

// The selection is pinned to the user message: applying a tool call reloads the canvas and clears
// draw.io's selection, so reading it again for the automatic follow-up request would lose it.
type DiagramChatMetadata = { selectedCells?: SelectedCell[] };

export type DiagramChatMessage = UIMessage<DiagramChatMetadata, UIDataTypes, DiagramChatTools & WebChatTools>;

export type OpenChat = { chatId: string; checkpoints: DiagramCheckpoints };

function countFailedToolCalls(message: DiagramChatMessage) {
  return message.parts.filter(part => 'state' in part && part.state === 'output-error').length;
}

function hasFailedToolCallInLatestStep(message: DiagramChatMessage) {
  const latestStepStart = message.parts.map(part => part.type).lastIndexOf('step-start');
  return message.parts.slice(latestStepStart + 1).some(part => isToolUIPart(part) && part.state === 'output-error');
}

/**
 * Only a rejected call goes back to the model. A successful edit ends the turn: sending it back
 * invited the model to apply a relative edit ("shrink to 80%") again on the already edited canvas.
 */
function shouldSendToolResults({ messages }: { messages: DiagramChatMessage[] }) {
  if (!lastAssistantMessageIsCompleteWithToolCalls({ messages })) return false;
  const latestMessage = messages[messages.length - 1];
  return hasFailedToolCallInLatestStep(latestMessage) && countFailedToolCalls(latestMessage) < MAX_FAILED_TOOL_CALLS_PER_TURN;
}

function keepTextParts(message: DiagramChatMessage): DiagramChatMessage {
  return { ...message, parts: message.parts.filter(part => part.type === 'text') };
}

/**
 * The latest turn goes out whole, since retries after a rejected tool call depend on it. Earlier
 * turns keep only their text, enough for follow-ups and answers to clarifying questions: the canvas
 * already holds their edits, and replaying the tool calls would invite the model to redo them.
 */
function messagesForModel(messages: DiagramChatMessage[]) {
  const userMessageIndexes = messages.flatMap((message, index) => message.role === 'user' ? [index] : []);
  const latestTurnStart = userMessageIndexes[userMessageIndexes.length - 1] ?? 0;
  const historyStart = userMessageIndexes[userMessageIndexes.length - 1 - MAX_HISTORY_TURNS] ?? 0;
  const history = messages.slice(historyStart, latestTurnStart)
    .map(keepTextParts)
    .filter(message => message.parts.length > 0);
  return [...history, ...messages.slice(latestTurnStart)];
}

function readChatTitle(messages: DiagramChatMessage[]) {
  const firstUserText = messages.find(message => message.role === 'user')?.parts
    .map(part => part.type === 'text' ? part.text : '').join('').trim() ?? '';
  return firstUserText.slice(0, MAX_CHAT_TITLE_LENGTH);
}

function buildChatContent(messages: DiagramChatMessage[], checkpoints: DiagramCheckpoints): ChatContent {
  return { title: readChatTitle(messages), messages, checkpoints };
}

/**
 * One project's assistant chat for the life of the browser tab. It outlives the editor page, so a
 * reply keeps streaming, applying its edits and saving while the user is on another page, and the
 * page shows the live chat again when the project reopens.
 *
 * Every request carries the diagram, the latest turn and the text of a few earlier turns, each user
 * message the selection it was sent with. Every applied tool call leaves a checkpoint, and the chat
 * is saved to the project whenever it goes idle.
 */
class DiagramChatSession {
  readonly chat: Chat<DiagramChatMessage>;
  #openChat: OpenChat = { chatId: crypto.randomUUID(), checkpoints: {} };
  readonly #listeners = new Set<() => void>();
  #canvasRef: RefObject<DiagramCanvasHandle | null> | null = null;
  // Edits applied while no editor showed this project; the editor takes them when the project reopens.
  #detachedXml: string | null = null;
  // The content last saved or loaded, serialized, so switching chats does not re-save them.
  #savedContent = '';
  #hasChosenChat = false;

  constructor(private readonly projectId: string) {
    this.chat = new Chat<DiagramChatMessage>({
      transport: new DefaultChatTransport<DiagramChatMessage>({
        api: CHAT_API,
        fetch: fetchOrThrowApiError,
        prepareSendMessagesRequest: async ({ messages }) => ({
          body: { messages: messagesForModel(messages), xml: await readGraphModelXml(await this.#readDiagramXml()) },
        }),
      }),
      sendAutomaticallyWhen: shouldSendToolResults,
      onToolCall: async ({ toolCall }) => {
        // Web search calls stream through here too, but the model API has already run them.
        if (toolCall.dynamic || toolCall.toolName === 'web_search') return;
        const { toolName, toolCallId } = toolCall;
        let toolOutput: Parameters<typeof this.chat.addToolOutput>[0];
        try {
          const checkpointXml = await applyDiagramToolCall(await this.#readDiagramXml(), toolCall);
          this.#showDiagram(checkpointXml);
          this.#setOpenChat({ ...this.#openChat, checkpoints: { ...this.#openChat.checkpoints, [toolCallId]: checkpointXml } });
          toolOutput = { tool: toolName, toolCallId, output: DIAGRAM_TOOL_SUCCESS_OUTPUT[toolName] };
          log('info', MODULE, 'Diagram tool applied', { toolName, isEditorOpen: this.#canvasRef !== null });
        } catch (error) {
          const errorText = error instanceof Error ? error.message : String(error);
          toolOutput = { state: 'output-error', tool: toolName, toolCallId, errorText };
          log('warn', MODULE, 'Diagram tool rejected', { toolName, ...serializeError(error) });
        }
        // NOTE: Must not be awaited. onToolCall runs inside the SDK's serial stream job, and
        // addToolOutput queues behind that job, so awaiting it deadlocks: the part stays
        // "input-available" (the chip keeps saying "Drawing…") and the stream never finishes.
        // The output may land after the stream has finished, so it gets its own save.
        void Promise.resolve(this.chat.addToolOutput(toolOutput)).then(() => this.#saveWhenIdle());
      },
      onFinish: () => this.#saveWhenIdle(),
      onError: error => log('error', MODULE, 'Chat request failed', serializeError(error)),
    });
    this.#restoreLatestChat();
  }

  readonly subscribe = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  readonly readOpenChat = () => this.#openChat;

  /**
   * Shows the chat's edits on the editor while it is open, starting with any made while it was away.
   *
   * Returns:
   *   The detach callback, for the editor page's unmount.
   */
  attachCanvas(canvasRef: RefObject<DiagramCanvasHandle | null>) {
    this.#canvasRef = canvasRef;
    if (this.#detachedXml !== null) {
      canvasRef.current!.loadXml(this.#detachedXml);
      this.#detachedXml = null;
      log('info', MODULE, 'Edits made while away applied to the editor', { projectId: this.projectId });
    }
    return () => {
      if (this.#canvasRef === canvasRef) this.#canvasRef = null;
    };
  }

  readonly sendMessage = (text: string, images: FileUIPart[]) => {
    this.#hasChosenChat = true;
    const metadata = { selectedCells: this.#canvasRef?.current?.readSelection() ?? [] };
    // An image-only message must not carry an empty text part.
    return this.chat.sendMessage(text ? { text, files: images, metadata } : { files: images, metadata });
  };

  readonly startNewChat = () => {
    this.#hasChosenChat = true;
    void this.chat.stop();
    this.chat.messages = [];
    this.chat.clearError();
    this.#setOpenChat({ chatId: crypto.randomUUID(), checkpoints: {} });
  };

  readonly openChat = (savedChatId: string) => {
    this.#hasChosenChat = true;
    getChat(this.projectId, savedChatId)
      .then(savedChat => this.#showChat(savedChat))
      .catch(error => log('error', MODULE, 'Open chat failed', { chatId: savedChatId, ...serializeError(error) }));
  };

  // The open chat is left first: otherwise the next save would write it straight back.
  readonly deleteChat = async (savedChatId: string) => {
    if (savedChatId === this.#openChat.chatId) this.startNewChat();
    await deleteSavedChat(this.projectId, savedChatId);
    log('info', MODULE, 'Chat deleted', { chatId: savedChatId });
  };

  /** The live canvas while the editor is open, else the latest saved diagram plus edits made since. */
  async #readDiagramXml() {
    if (this.#detachedXml !== null) return this.#detachedXml;
    const canvas = this.#canvasRef?.current;
    if (!canvas) return queryClient.fetchQuery(diagramXmlQuery(this.projectId));
    const canvasXml = canvas.readXml();
    if (!canvasXml) throw new Error('The diagram is still loading');
    return canvasXml;
  }

  #showDiagram(xml: string) {
    const canvas = this.#canvasRef?.current;
    if (!canvas) {
      this.#detachedXml = xml;
      return;
    }
    canvas.loadXml(xml);
    canvas.fitDiagram();
  }

  #setOpenChat(openChat: OpenChat) {
    this.#openChat = openChat;
    this.#listeners.forEach(listener => listener());
  }

  #saveWhenIdle() {
    const { status, messages } = this.chat;
    if (status === 'submitted' || status === 'streaming' || messages.length === 0) return;
    const { chatId, checkpoints } = this.#openChat;
    const content = buildChatContent(messages, checkpoints);
    const serializedContent = JSON.stringify(content);
    if (serializedContent === this.#savedContent) return;
    this.#savedContent = serializedContent;
    saveChat(this.projectId, chatId, content)
      .then(() => log('debug', MODULE, 'Chat saved', { chatId, messageCount: content.messages.length }))
      .catch(error => log('error', MODULE, 'Save chat failed', { chatId, ...serializeError(error) }));
  }

  #showChat(savedChat: SavedChat) {
    this.#savedContent = JSON.stringify(buildChatContent(savedChat.messages, savedChat.checkpoints));
    this.chat.clearError();
    this.chat.messages = savedChat.messages;
    this.#setOpenChat({ chatId: savedChat.id, checkpoints: savedChat.checkpoints });
    log('info', MODULE, 'Chat opened', { chatId: savedChat.id });
  }

  // Whatever the user picks or starts while the restore is still loading wins over it.
  #restoreLatestChat() {
    listChats(this.projectId)
      .then(async ([latestChat]) => {
        if (!latestChat) return;
        const savedChat = await getChat(this.projectId, latestChat.id);
        if (!this.#hasChosenChat) this.#showChat(savedChat);
      })
      .catch(error => log('error', MODULE, 'Restore latest chat failed', { projectId: this.projectId, ...serializeError(error) }));
  }
}

const sessionByProjectId = new Map<string, DiagramChatSession>();

/** The project's chat session, created (and its latest saved chat restored) on first use in this tab. */
export function openDiagramChatSession(projectId: string) {
  let session = sessionByProjectId.get(projectId);
  if (!session) {
    session = new DiagramChatSession(projectId);
    sessionByProjectId.set(projectId, session);
  }
  return session;
}
