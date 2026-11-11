// Shared control looks, mirroring next-ai-draw-io's button and input variants.

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring';

export const PRIMARY_BUTTON_CLASS = `inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-[opacity,background-color] hover:opacity-85 disabled:pointer-events-none disabled:bg-muted disabled:text-faint ${FOCUS_RING}`;

export const OUTLINE_BUTTON_CLASS = `inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[13px] text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`;

export const GHOST_BUTTON_CLASS = `inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-35 ${FOCUS_RING}`;

export const DESTRUCTIVE_BUTTON_CLASS = `inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-destructive/25 px-2.5 text-[13px] text-destructive transition-colors hover:bg-destructive/5 disabled:pointer-events-none disabled:opacity-50 ${FOCUS_RING}`;

export const TEXT_INPUT_CLASS = 'h-9 w-full min-w-0 rounded-xl border border-border-subtle bg-surface-1 px-3.5 text-sm text-foreground placeholder:text-faint transition-all duration-150 ease-out hover:border-border-default focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10';
