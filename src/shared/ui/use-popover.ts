import { useCallback, useRef, useState } from 'react';
import { useDismiss } from './use-dismiss';

/** Open state for a trigger + floating panel that share `rootRef`; an outside press or Escape closes it. */
export function usePopover<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(open => !open), []);
  useDismiss(rootRef, isOpen, close);
  return { rootRef, isOpen, toggle, close };
}
