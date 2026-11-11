import type { KeyboardEvent } from 'react';
import { FIELD_FOCUS_CLASS } from './control-class';

type InlineNameInputProps = {
  initialName: string;
  label: string;
  /** Called only with a non-empty name that differs from `initialName`. */
  onSubmit: (name: string) => void;
  /** Called whenever editing ends, submitted or not. */
  onFinish: () => void;
  className?: string;
};

/** Enter or blur submits, Escape cancels. */
export function InlineNameInput({ initialName, label, onSubmit, onFinish, className = '' }: InlineNameInputProps) {
  function finish(rawName: string) {
    onFinish();
    const name = rawName.trim();
    if (name && name !== initialName) onSubmit(name);
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key === 'Escape') {
      // Restoring the original name turns the blur that follows into a no-op.
      event.currentTarget.value = initialName;
      event.currentTarget.blur();
    }
  }

  return (
    <input
      autoFocus
      defaultValue={initialName}
      aria-label={label}
      onFocus={event => event.currentTarget.select()}
      onBlur={event => finish(event.currentTarget.value)}
      onKeyDown={handleKey}
      className={`h-7 min-w-0 rounded-md border border-line bg-surface px-1.5 text-sm text-ink outline-none ${FIELD_FOCUS_CLASS} ${className}`}
    />
  );
}
