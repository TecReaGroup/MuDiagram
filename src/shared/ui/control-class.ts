// Size and tone are separate lookups because Tailwind does not guarantee which of two
// conflicting utilities wins; appending `size-7` to a `size-8` class silently does nothing.

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type ButtonSize = 'md' | 'lg' | 'xl';
type IconButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-1 focus-visible:ring-offset-surface';

// Applies to a text input itself or to a wrapper around one (:focus-within matches both).
export const FIELD_FOCUS_CLASS = 'transition-[border-color,background-color,box-shadow] duration-150 focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10';

export const SURFACE_CARD_CLASS = 'rounded-xl border border-line bg-surface shadow-xs';

const CONTROL_BASE = `inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,box-shadow,opacity] duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0 ${FOCUS_RING}`;

const BUTTON_TONE_CLASS: Record<ButtonTone, string> = {
  primary: 'bg-ink text-white shadow-xs hover:bg-ink/85',
  secondary: 'border border-line bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-sunken',
  ghost: 'text-ink-muted hover:bg-hover hover:text-ink',
  accent: 'border border-brand/30 bg-brand-soft text-brand-ink shadow-xs hover:border-brand/40',
  danger: 'text-ink-muted hover:bg-danger-soft hover:text-danger',
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  md: 'h-8 gap-1.5 rounded-lg px-3 text-[13px] font-medium [&_svg]:size-4',
  lg: 'h-9 gap-1.5 rounded-lg px-4 text-[13px] font-medium [&_svg]:size-4',
  xl: 'h-10 gap-1.5 rounded-xl px-4 text-sm font-medium [&_svg]:size-4',
};

const ICON_BUTTON_SIZE_CLASS: Record<IconButtonSize, string> = {
  sm: 'size-7 rounded-md [&_svg]:size-3.5',
  md: 'size-8 rounded-lg [&_svg]:size-4',
  lg: 'size-9 rounded-lg [&_svg]:size-4',
  xl: 'size-10 rounded-xl [&_svg]:size-5',
};

export function buttonClass(tone: ButtonTone, size: ButtonSize = 'md') {
  return `${CONTROL_BASE} ${BUTTON_TONE_CLASS[tone]} ${BUTTON_SIZE_CLASS[size]}`;
}

export function iconButtonClass(tone: ButtonTone = 'ghost', size: IconButtonSize = 'md') {
  return `${CONTROL_BASE} ${BUTTON_TONE_CLASS[tone]} ${ICON_BUTTON_SIZE_CLASS[size]}`;
}

// Selection is driven by aria-current="page" (set by NavLink), so callers never pass an active flag.
// Pair with NAV_ITEM_COUNT_CLASS for a trailing count badge.
export const NAV_ITEM_CLASS = `group flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-ink-muted transition-colors duration-150 hover:bg-hover hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:font-medium aria-[current=page]:text-white aria-[current=page]:hover:bg-ink aria-[current=page]:hover:text-white [&_svg]:size-4 [&_svg]:shrink-0 ${FOCUS_RING}`;

export const NAV_ITEM_COUNT_CLASS = 'ml-auto text-xs tabular-nums text-ink-faint group-aria-[current=page]:text-white/60';
