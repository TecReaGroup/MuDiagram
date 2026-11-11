import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { FIELD_INPUT_CLASS, FIELD_OPTION_CLASS, MENU_PANEL_CLASS } from './control-class';
import { useDismiss } from './use-dismiss';

export type SelectOption<T> = { value: T; label: string };

type SelectMenuProps<T extends string | null> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

/** Styled replacement for a native <select>, whose option popup cannot be themed. */
export function SelectMenu<T extends string | null>({ value, options, onChange }: SelectMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(rootRef, isOpen, close);

  const selectedLabel = options.find(option => option.value === value)?.label;

  function select(nextValue: T) {
    close();
    if (nextValue !== value) onChange(nextValue);
  }

  // Inside a modal <dialog>, Escape would also close the dialog; the open menu claims it first.
  function closeOnEscape(event: KeyboardEvent) {
    if (!isOpen || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }

  return (
    <div ref={rootRef} onKeyDown={closeOnEscape} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`${FIELD_INPUT_CLASS} flex items-center gap-2 text-left aria-expanded:border-brand/50 aria-expanded:ring-4 aria-expanded:ring-brand/10`}
      >
        <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
        <ChevronDown className={`size-4 shrink-0 text-ink-faint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div role="menu" className={`${MENU_PANEL_CLASS} scrollbar-thin absolute inset-x-0 top-full mt-1.5 max-h-56 origin-top overflow-y-auto`}>
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value ?? ''}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => select(option.value)}
                className={FIELD_OPTION_CLASS}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0 text-ink" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
