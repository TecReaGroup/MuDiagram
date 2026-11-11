import { History, Trash } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useI18n } from '../../shared/i18n/language-context';
import { log, serializeError } from '../../shared/lib/logger';
import { formatRelativeTime } from '../../shared/lib/relative-time';
import { ConfirmDeleteButton } from '../../shared/ui/ConfirmDeleteButton';
import { HOVER_REVEAL_CLASS, iconButtonClass, MENU_ITEM_CLASS, MENU_PANEL_CLASS } from '../../shared/ui/control-class';
import { useDismiss } from '../../shared/ui/use-dismiss';
import { listChats, type ChatSummary } from './chat-history-api';

const MODULE = 'ChatHistory';

type ChatHistoryMenuProps = {
  projectId: string;
  currentChatId: string;
  isDisabled: boolean;
  onOpenChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => Promise<void>;
};

/**
 * Lists the project's saved chats; fetched on every opening so a chat saved moments ago shows up.
 *
 * The dropdown is positioned against the nearest positioned ancestor (the chat panel), so it spans
 * the panel below its header instead of hanging off the small trigger button.
 */
export function ChatHistoryMenu({ projectId, currentChatId, isDisabled, onOpenChat, onDeleteChat }: ChatHistoryMenuProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[] | null>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setChatSummaries(null), []);
  useDismiss(menuRootRef, chatSummaries !== null, close);

  const toggleMenu = () => {
    if (chatSummaries) {
      close();
      return;
    }
    listChats(projectId)
      .then(setChatSummaries)
      .catch(error => log('error', MODULE, 'List chats failed', { projectId, ...serializeError(error) }));
  };

  const openChat = (chatId: string) => {
    close();
    if (chatId !== currentChatId) onOpenChat(chatId);
  };

  const deleteChat = (chatId: string) => {
    onDeleteChat(chatId)
      .then(() => setChatSummaries(current => current?.filter(chatSummary => chatSummary.id !== chatId) ?? null))
      .catch(error => log('error', MODULE, 'Delete chat failed', { projectId, chatId, ...serializeError(error) }));
  };

  return (
    <div ref={menuRootRef}>
      <button
        type="button"
        onClick={toggleMenu}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={chatSummaries !== null}
        aria-label={t('ai.history')}
        title={t('ai.history')}
        className={iconButtonClass()}
      >
        <History />
      </button>

      {chatSummaries && (
        <div role="menu" aria-label={t('ai.history')} className={`${MENU_PANEL_CLASS} scrollbar-subtle absolute inset-x-2 top-13 max-h-80 origin-top overflow-y-auto`}>
          {chatSummaries.length === 0 && <p className="px-2.5 py-2 text-ui text-ink-faint">{t('ai.historyEmpty')}</p>}
          {chatSummaries.map(chatSummary => {
            const title = chatSummary.title || t('ai.untitledChat');
            return (
              <div key={chatSummary.id} className="group relative">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={chatSummary.id === currentChatId}
                  onClick={() => openChat(chatSummary.id)}
                  className={`${MENU_ITEM_CLASS} flex h-auto flex-col items-start gap-0.5 py-1.5 pr-9 text-left`}
                >
                  <span className="w-full truncate">{title}</span>
                  <span className="text-2xs font-normal text-ink-faint">{formatRelativeTime(chatSummary.updatedAt, i18n)}</span>
                </button>
                <div className={`${HOVER_REVEAL_CLASS} absolute inset-y-0 right-1 flex items-center`}>
                  <ConfirmDeleteButton
                    label={t('ai.deleteChat')}
                    title={t('ai.confirmDeleteChatTitle')}
                    description={t('ai.confirmDeleteChatDescription', { name: title })}
                    onConfirm={() => deleteChat(chatSummary.id)}
                    className={iconButtonClass('danger', 'sm')}
                  >
                    <Trash />
                  </ConfirmDeleteButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
