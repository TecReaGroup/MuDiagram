import type { ReactNode } from 'react';

/** Labelled wrapper; the <label> element ties the text to the single control inside. */
export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-ui font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
