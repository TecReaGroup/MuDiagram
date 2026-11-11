// Placeholder thumbnail until real diagram previews exist; the layout is picked from the
// project id so each card looks distinct but stays stable across renders.

const NODE_CLASS = 'fill-surface stroke-line-strong';
const EDGE_CLASS = 'stroke-line-strong';
const ACCENT_NODE_CLASS = 'fill-brand-soft stroke-brand/60';

function FlowSketch() {
  return (
    <>
      <path d="M78 50H112M158 50H192M135 62V92" className={EDGE_CLASS} />
      <rect x="32" y="38" width="46" height="24" rx="6" className={NODE_CLASS} />
      <rect x="112" y="38" width="46" height="24" rx="6" className={ACCENT_NODE_CLASS} />
      <rect x="192" y="38" width="46" height="24" rx="6" className={NODE_CLASS} />
      <rect x="112" y="92" width="46" height="24" rx="12" className={NODE_CLASS} />
    </>
  );
}

function TreeSketch() {
  return (
    <>
      <path d="M135 50V66M80 66H190M80 66V82M135 66V82M190 66V82" className={EDGE_CLASS} />
      <rect x="110" y="26" width="50" height="24" rx="6" className={ACCENT_NODE_CLASS} />
      <rect x="57" y="82" width="46" height="24" rx="6" className={NODE_CLASS} />
      <rect x="112" y="82" width="46" height="24" rx="6" className={NODE_CLASS} />
      <rect x="167" y="82" width="46" height="24" rx="6" className={NODE_CLASS} />
    </>
  );
}

function HubSketch() {
  return (
    <>
      <path d="M135 72L72 40M135 72L198 40M135 72L72 104M135 72L198 104" className={EDGE_CLASS} />
      <circle cx="135" cy="72" r="16" className={ACCENT_NODE_CLASS} />
      <rect x="50" y="30" width="44" height="20" rx="5" className={NODE_CLASS} />
      <rect x="176" y="30" width="44" height="20" rx="5" className={NODE_CLASS} />
      <rect x="50" y="94" width="44" height="20" rx="5" className={NODE_CLASS} />
      <rect x="176" y="94" width="44" height="20" rx="5" className={NODE_CLASS} />
    </>
  );
}

const SKETCHES = [FlowSketch, TreeSketch, HubSketch];

function pickSketch(seed: string) {
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SKETCHES[hash % SKETCHES.length];
}

export function DiagramSketch({ seed }: { seed: string }) {
  const Sketch = pickSketch(seed);
  return (
    <svg viewBox="0 0 270 140" fill="none" strokeWidth="1.25" aria-hidden className="h-full w-full">
      <Sketch />
    </svg>
  );
}
