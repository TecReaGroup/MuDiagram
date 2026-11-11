// Same geometry as public/favicon.svg: a node, an elbow connector, and an accent endpoint.
export function BrandMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={`shrink-0 ${className}`}>
      <rect width="32" height="32" rx="8" fill="var(--color-ink)" />
      <rect x="7" y="7.5" width="9" height="9" rx="2.5" fill="#fff" />
      <path d="M16 12H20.5C21.88 12 23 13.12 23 14.5V17.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="23" cy="22" r="4" fill="#8b8bf0" />
    </svg>
  );
}
