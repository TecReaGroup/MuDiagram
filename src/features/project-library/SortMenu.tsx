import { ListSortDescending, ChevronDown } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { FOCUS_RING, MENU_ITEM_CLASS, MENU_PANEL_CLASS } from '../../shared/ui/control-class';
import { useDismiss } from '../../shared/ui/use-dismiss';
import { SORT_ORDERS, type SortOrderId } from './library-view';

type SortMenuProps = {
  selectedId: SortOrderId;
  onSelect: (sortId: SortOrderId) => void;
};

export function SortMenu({ selectedId, onSelect }: SortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(menuRootRef, isOpen, close);

  const selectOrder = (sortId: SortOrderId) => {
    onSelect(sortId);
    close();
  };

  return (
    <div ref={menuRootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`inline-flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors hover:bg-hover hover:text-ink ${FOCUS_RING} ${isOpen ? 'bg-hover text-ink' : 'text-ink-muted'}`}
      >
        <ListSortDescending className="size-4" />
        {/* All labels share one grid cell so the button keeps the longest label's width. */}
        <span className="inline-grid justify-items-center text-center">
          {SORT_ORDERS.map(order => (
            <span key={order.id} aria-hidden={order.id !== selectedId} className={`col-start-1 row-start-1 ${order.id === selectedId ? '' : 'invisible'}`}>
              {order.label}
            </span>
          ))}
        </span>
        <ChevronDown className={`size-3.5 text-ink-faint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div role="menu" aria-label="排序方式" className={`${MENU_PANEL_CLASS} absolute inset-x-0 top-9 origin-top`}>
          {SORT_ORDERS.map(order => (
            <button
              key={order.id}
              type="button"
              role="menuitemradio"
              aria-checked={order.id === selectedId}
              onClick={() => selectOrder(order.id)}
              className={`${MENU_ITEM_CLASS} text-center`}
            >
              {order.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
