// Size and tone are separate lookups because Tailwind does not guarantee which of two
// conflicting utilities wins; appending `size-7` to a `size-8` class silently does nothing.

// `inverse` sits on a dark (selected) surface such as an active nav item.
// `danger` is a quiet icon action; `destructive` is the solid button that commits the deletion.
type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger' | 'destructive' | 'inverse';
type ButtonSize = 'md' | 'lg' | 'xl';
type IconButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export const FOCUS_RING = 'outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-1 focus-visible:ring-offset-surface';

// Applies to a text input itself or to a wrapper around one (:focus-within matches both).
export const FIELD_FOCUS_CLASS = 'transition-[border-color,background-color,box-shadow] duration-150 focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10';

export const FIELD_INPUT_CLASS = `h-10 w-full rounded-xl border border-line bg-surface px-3.5 text-ui text-ink outline-none placeholder:text-ink-faint hover:border-line-strong ${FIELD_FOCUS_CLASS}`;

// An option in a form field's dropdown: same type as FIELD_INPUT_CLASS so the open list reads as the
// field's own values; selection shows as a background plus a check icon, never as a weight change.
export const FIELD_OPTION_CLASS = 'flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-ui text-ink transition-colors hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none aria-checked:bg-sunken';

export const SURFACE_CARD_CLASS = 'rounded-xl border border-line bg-surface shadow-xs';

// For a native <dialog> opened with showModal(); callers add size and padding.
export const MODAL_DIALOG_CLASS = 'm-auto rounded-2xl bg-surface text-ink shadow-pop backdrop:bg-ink/30 backdrop:backdrop-blur-[2px] open:animate-pop-in backdrop:animate-backdrop-in';

// Secondary actions of a list row or card, shown while the nearest `group` ancestor is hovered or holds focus.
// Always visible on touch screens, which have no hover to reveal them.
export const HOVER_REVEAL_CLASS = 'transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100';

const CONTROL_BASE = `inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,box-shadow,opacity] duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0 ${FOCUS_RING}`;

const BUTTON_TONE_CLASS: Record<ButtonTone, string> = {
  primary: 'bg-ink text-white shadow-xs hover:bg-ink/85',
  secondary: 'border border-line bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-sunken',
  ghost: 'text-ink-muted hover:bg-hover hover:text-ink',
  accent: 'border border-brand/30 bg-brand-soft text-brand-ink shadow-xs hover:border-brand/40',
  danger: 'text-ink-muted hover:bg-danger-soft hover:text-danger',
  destructive: 'bg-danger text-white shadow-xs hover:bg-danger/90',
  inverse: 'text-white/70 hover:bg-white/15 hover:text-white',
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  md: 'h-8 gap-1.5 rounded-lg px-3 text-ui font-medium [&_svg]:size-4',
  lg: 'h-9 gap-1.5 rounded-lg px-4 text-ui font-medium [&_svg]:size-4',
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

// The gap keeps the checked item's and hovered item's backgrounds from merging into one block.
export const MENU_PANEL_CLASS = 'z-20 flex animate-pop-in flex-col gap-0.5 rounded-lg bg-surface p-1 shadow-pop';

// Selection is driven by aria-checked (menuitemradio), so callers never pass a selected flag.
export const MENU_ITEM_CLASS = 'h-8 w-full truncate rounded-md px-2.5 text-sm text-ink-muted transition-colors hover:bg-sunken hover:text-ink focus-visible:bg-sunken focus-visible:outline-none aria-checked:bg-sunken aria-checked:font-medium aria-checked:text-ink';
