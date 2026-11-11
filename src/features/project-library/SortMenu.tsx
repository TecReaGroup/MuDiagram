import { ListSortDescending, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FOCUS_RING } from '../../shared/ui/control-class';

const SORT_ORDERS = ['最近修改', '最近创建', '名称'] as const;

type SortOrder = (typeof SORT_ORDERS)[number];

export function SortMenu() {
  const [selectedOrder, setSelectedOrder] = useState<SortOrder>(SORT_ORDERS[0]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const selectOrder = (order: SortOrder) => {
    setSelectedOrder(order);
    setIsOpen(false);
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
            <span key={order} aria-hidden={order !== selectedOrder} className={`col-start-1 row-start-1 ${order === selectedOrder ? '' : 'invisible'}`}>
              {order}
            </span>
          ))}
        </span>
        <ChevronDown className={`size-3.5 text-ink-faint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div role="menu" aria-label="排序方式" className="absolute inset-x-0 top-9 z-20 origin-top animate-pop-in rounded-lg bg-surface p-1 shadow-pop">
          {SORT_ORDERS.map(order => {
            const isSelected = order === selectedOrder;
            return (
              <button
                key={order}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => selectOrder(order)}
                className={`h-8 w-full rounded-md text-center text-sm transition-colors hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none ${isSelected ? 'bg-sunken font-medium text-ink' : 'text-ink-muted hover:text-ink'}`}
              >
                {order}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
