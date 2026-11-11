import { useEffect, type RefObject } from 'react';

/** Calls `dismiss` on a pointer press outside `rootRef` (including into an iframe) or on Escape, while `isOpen`. */
export function useDismiss(rootRef: RefObject<HTMLElement>, isOpen: boolean, dismiss: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) dismiss();
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    // Presses inside an iframe (e.g. the draw.io canvas) never reach this document; they only blur the window.
    // Deferred because activeElement points at the iframe only after the blur event has finished.
    const dismissOnIframeFocus = () => {
      window.setTimeout(() => {
        if (document.activeElement instanceof HTMLIFrameElement) dismiss();
      });
    };
    document.addEventListener('pointerdown', dismissOnOutsidePointer);
    document.addEventListener('keydown', dismissOnEscape);
    window.addEventListener('blur', dismissOnIframeFocus);
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsidePointer);
      document.removeEventListener('keydown', dismissOnEscape);
      window.removeEventListener('blur', dismissOnIframeFocus);
    };
  }, [rootRef, isOpen, dismiss]);
}
