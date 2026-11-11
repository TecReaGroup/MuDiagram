import { ListSortDescending, ChevronDown } from 'lucide-react';
import { useI18n } from '../../shared/i18n/language-context';
import { buttonClass, MENU_ITEM_CLASS, MENU_PANEL_CLASS } from '../../shared/ui/control-class';
import { usePopover } from '../../shared/ui/use-popover';
import { SORT_ORDERS, type SortOrderId } from './library-view';

type SortMenuProps = {
  selectedId: SortOrderId;
  onSelect: (sortId: SortOrderId) => void;
};

export function SortMenu({ selectedId, onSelect }: SortMenuProps) {
  const { t } = useI18n();
  const { rootRef, isOpen, toggle, close } = usePopover<HTMLDivElement>();

  const selectOrder = (sortId: SortOrderId) => {
    onSelect(sortId);
    close();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`${buttonClass('ghost')} aria-expanded:bg-hover aria-expanded:text-ink`}
      >
        <ListSortDescending />
        {/* All labels share one grid cell so the button keeps the longest label's width. */}
        <span className="inline-grid justify-items-center text-center">
          {SORT_ORDERS.map(order => (
            <span key={order.id} aria-hidden={order.id !== selectedId} className={`col-start-1 row-start-1 ${order.id === selectedId ? '' : 'invisible'}`}>
              {t(order.labelKey)}
            </span>
          ))}
        </span>
        <ChevronDown className={`text-ink-faint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div role="menu" aria-label={t('library.sortOrder')} className={`${MENU_PANEL_CLASS} absolute inset-x-0 top-9 origin-top`}>
          {SORT_ORDERS.map(order => (
            <button
              key={order.id}
              type="button"
              role="menuitemradio"
              aria-checked={order.id === selectedId}
              onClick={() => selectOrder(order.id)}
              className={`${MENU_ITEM_CLASS} text-center`}
            >
              {t(order.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
