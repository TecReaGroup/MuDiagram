import { useEffect, type RefObject } from 'react';

/** Calls `dismiss` on a pointer press outside `rootRef` or on Escape, while `isOpen`. */
export function useDismiss(rootRef: RefObject<HTMLElement>, isOpen: boolean, dismiss: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) dismiss();
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    document.addEventListener('pointerdown', dismissOnOutsidePointer);
    document.addEventListener('keydown', dismissOnEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsidePointer);
      document.removeEventListener('keydown', dismissOnEscape);
    };
  }, [rootRef, isOpen, dismiss]);
}
