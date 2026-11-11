import type { ReactNode } from 'react';

// Must match the h-9 in NAV_ITEM_CLASS and the space-y-0.5 below.
const NAV_ITEM_HEIGHT_REM = 2.25;
const NAV_ITEM_GAP_REM = 0.125;

type NavItemListProps = {
  id?: string;
  hidden?: boolean;
  maxVisibleItems: number;
  className?: string;
  children: ReactNode;
};

/** Vertical list of nav items that scrolls once it holds more than `maxVisibleItems`. */
export function NavItemList({ id, hidden, maxVisibleItems, className = '', children }: NavItemListProps) {
  const maxHeightRem = maxVisibleItems * NAV_ITEM_HEIGHT_REM + (maxVisibleItems - 1) * NAV_ITEM_GAP_REM;

  return (
    <nav id={id} hidden={hidden} style={{ maxHeight: `${maxHeightRem}rem` }} className={`scrollbar-subtle space-y-0.5 overflow-y-auto ${className}`}>
      {children}
    </nav>
  );
}
