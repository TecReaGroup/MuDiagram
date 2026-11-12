import { useChat } from '@ai-sdk/react';
import { useEffect, useSyncExternalStore, type RefObject } from 'react';
import type { DiagramCanvasHandle } from '../diagram-editor/DiagramCanvas';
import { openDiagramChatSession } from './diagram-chat-session';

export type { DiagramChatMessage } from './diagram-chat-session';

/** Binds the project's tab-wide chat session to the editor page while it is mounted. */
export function useDiagramChat(canvasRef: RefObject<DiagramCanvasHandle | null>, projectId: string) {
  const session = openDiagramChatSession(projectId);
  const { chatId, checkpoints } = useSyncExternalStore(session.subscribe, session.readOpenChat);
  const chat = useChat({ chat: session.chat });

  useEffect(() => session.attachCanvas(canvasRef), [session, canvasRef]);

  return {
    chatId,
    messages: chat.messages,
    checkpoints,
    error: chat.error,
    isBusy: chat.status === 'submitted' || chat.status === 'streaming',
    sendMessage: session.sendMessage,
    stop: chat.stop,
    startNewChat: session.startNewChat,
    openChat: session.openChat,
    deleteChat: session.deleteChat,
  };
}
