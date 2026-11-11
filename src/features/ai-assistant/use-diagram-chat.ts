import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart, lastAssistantMessageIsCompleteWithToolCalls, type UIDataTypes, type UIMessage } from 'ai';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { fetchOrThrowApiError } from '../../shared/api/request-json';
import { log, serializeError } from '../../shared/lib/logger';
import type { DiagramCanvasHandle } from '../diagram-editor/DiagramCanvas';
import type { SelectedCell } from '../diagram-editor/drawio-editor-bridge';
import { deleteChat as deleteSavedChat, getChat, listChats, saveChat, type ChatContent, type DiagramCheckpoints, type SavedChat } from './chat-history-api';
import { applyDiagramToolCall, DIAGRAM_TOOL_SUCCESS_OUTPUT, readGraphModelXml, type DiagramChatTools } from './diagram-tool';

const MODULE = 'AiAssistant';
const CHAT_API = '/api/ai/chat';
// A rejected tool call is sent back so the model can fix it; this caps how many rejections one
// turn may burn through before the user has to step in.
const MAX_FAILED_TOOL_CALLS_PER_TURN = 3;
const MAX_CHAT_TITLE_LENGTH = 60;

// The selection is pinned to the user message: applying a tool call reloads the canvas and clears
// draw.io's selection, so reading it again for the automatic follow-up request would lose it.
type DiagramChatMetadata = { selectedCells?: SelectedCell[] };

export type DiagramChatMessage = UIMessage<DiagramChatMetadata, UIDataTypes, DiagramChatTools>;

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

/**
 * Each turn stands alone: the canvas already holds the outcome of earlier turns, so replaying the
 * conversation would only cost tokens and invite the model to redo old requests.
 */
function messagesOfLatestTurn(messages: DiagramChatMessage[]) {
  return messages.slice(messages.map(message => message.role).lastIndexOf('user'));
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
 * Chat with the diagram assistant: every request carries the live canvas and the latest turn, each
 * user message the selection it was sent with, and the tool calls the model makes are applied to
 * the canvas in the browser. Every applied call leaves a checkpoint, and the chat is saved to the
 * project after each turn.
 */
export function useDiagramChat(canvasRef: RefObject<DiagramCanvasHandle | null>, projectId: string) {
  const [chatId, setChatId] = useState<string>(() => crypto.randomUUID());
  const [checkpoints, setCheckpoints] = useState<DiagramCheckpoints>({});
  // The content last saved or loaded, serialized, so switching chats does not re-save them.
  const savedContentRef = useRef('');
  const hasChosenChatRef = useRef(false);

  const readCanvasXml = () => {
    const canvasXml = canvasRef.current?.readXml();
    if (!canvasXml) throw new Error('The diagram is still loading');
    return canvasXml;
  };

  const [transport] = useState(() => new DefaultChatTransport<DiagramChatMessage>({
    api: CHAT_API,
    fetch: fetchOrThrowApiError,
    prepareSendMessagesRequest: async ({ messages }) => ({
      body: { messages: messagesOfLatestTurn(messages), xml: await readGraphModelXml(readCanvasXml()) },
    }),
  }));

  const chat = useChat<DiagramChatMessage>({
    transport,
    sendAutomaticallyWhen: shouldSendToolResults,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.dynamic) return;
      const { toolName, toolCallId } = toolCall;
      try {
        const checkpointXml = await applyDiagramToolCall(readCanvasXml(), toolCall);
        canvasRef.current!.loadXml(checkpointXml);
        setCheckpoints(current => ({ ...current, [toolCallId]: checkpointXml }));
        void chat.addToolOutput({ tool: toolName, toolCallId, output: DIAGRAM_TOOL_SUCCESS_OUTPUT[toolName] });
        log('info', MODULE, 'Diagram tool applied', { toolName });
      } catch (error) {
        const errorText = error instanceof Error ? error.message : String(error);
        void chat.addToolOutput({ state: 'output-error', tool: toolName, toolCallId, errorText });
        log('warn', MODULE, 'Diagram tool rejected', { toolName, ...serializeError(error) });
      }
    },
    onError: error => log('error', MODULE, 'Chat request failed', serializeError(error)),
  });

  const isBusy = chat.status === 'submitted' || chat.status === 'streaming';

  // NOTE: Tool outputs and checkpoints may land after the stream has ended, so this saves on any
  // change while idle rather than once when a turn finishes.
  useEffect(() => {
    if (isBusy || chat.messages.length === 0) return;
    const content = buildChatContent(chat.messages, checkpoints);
    const serializedContent = JSON.stringify(content);
    if (serializedContent === savedContentRef.current) return;
    savedContentRef.current = serializedContent;
    saveChat(projectId, chatId, content)
      .then(() => log('debug', MODULE, 'Chat saved', { chatId, messageCount: content.messages.length }))
      .catch(error => log('error', MODULE, 'Save chat failed', { chatId, ...serializeError(error) }));
  }, [isBusy, chat.messages, checkpoints, projectId, chatId]);

  const showChat = (savedChat: SavedChat) => {
    savedContentRef.current = JSON.stringify(buildChatContent(savedChat.messages, savedChat.checkpoints));
    chat.clearError();
    chat.setMessages(savedChat.messages);
    setCheckpoints(savedChat.checkpoints);
    setChatId(savedChat.id);
    log('info', MODULE, 'Chat opened', { chatId: savedChat.id });
  };

  // The panel is keyed by project, so this runs once per opening. Whatever the user picks or starts
  // while the restore is still loading wins over it.
  useEffect(() => {
    listChats(projectId)
      .then(async ([latestChat]) => {
        if (!latestChat) return;
        const savedChat = await getChat(projectId, latestChat.id);
        if (!hasChosenChatRef.current) showChat(savedChat);
      })
      .catch(error => log('error', MODULE, 'Restore latest chat failed', { projectId, ...serializeError(error) }));
  }, [projectId]);

  const startNewChat = () => {
    hasChosenChatRef.current = true;
    void chat.stop();
    chat.setMessages([]);
    chat.clearError();
    setCheckpoints({});
    setChatId(crypto.randomUUID());
  };

  const openChat = (savedChatId: string) => {
    hasChosenChatRef.current = true;
    getChat(projectId, savedChatId)
      .then(showChat)
      .catch(error => log('error', MODULE, 'Open chat failed', { chatId: savedChatId, ...serializeError(error) }));
  };

  // The open chat is left first: otherwise the autosave effect would write it straight back.
  const deleteChat = async (savedChatId: string) => {
    if (savedChatId === chatId) startNewChat();
    await deleteSavedChat(projectId, savedChatId);
    log('info', MODULE, 'Chat deleted', { chatId: savedChatId });
  };

  const sendText = (text: string) => {
    hasChosenChatRef.current = true;
    return chat.sendMessage({ text, metadata: { selectedCells: canvasRef.current?.readSelection() ?? [] } });
  };

  return {
    chatId,
    messages: chat.messages,
    checkpoints,
    error: chat.error,
    isBusy,
    sendText,
    stop: chat.stop,
    startNewChat,
    openChat,
    deleteChat,
  };
}
