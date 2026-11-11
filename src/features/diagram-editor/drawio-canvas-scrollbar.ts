const SCROLLING_CLASS = 'mu-scrolling';
const DRAGGING_CLASS = 'mu-dragging';
const THUMB_CLASS = 'mu-canvas-scroll-thumb';
// Long enough to bridge the gaps between wheel ticks, so the thumb does not flicker mid-scroll.
const SCROLLBAR_IDLE_HIDE_MS = 800;
const SCROLLBAR_FADE_MS = 300;
const THUMB_THICKNESS_PX = 6;
const THUMB_EDGE_INSET_PX = 3;
const THUMB_MIN_LENGTH_PX = 32;

// NOTE: Native scrollbars always take a gutter in Chromium (overflow: overlay is gone), and that
// gutter shows the container's grey workspace colour. So the native bars are hidden, letting the
// canvas reach the right and bottom edges, and thin thumbs are drawn over it instead.
const CANVAS_SCROLLBAR_STYLE = `
.geEditor .geDiagramContainer {
  scrollbar-width: none;
}
.geEditor .geDiagramContainer::-webkit-scrollbar {
  display: none;
}
.${THUMB_CLASS} {
  position: fixed;
  z-index: 10;
  border-radius: 9999px;
  background: rgb(23 23 28 / 0.2);
  opacity: 0;
  pointer-events: none;
  transition: opacity ${SCROLLBAR_FADE_MS}ms ease, background-color 150ms;
}
.${THUMB_CLASS}.${SCROLLING_CLASS},
.${THUMB_CLASS}.${DRAGGING_CLASS} {
  opacity: 1;
  pointer-events: auto;
}
.${THUMB_CLASS}:hover,
.${THUMB_CLASS}.${DRAGGING_CLASS} {
  background: rgb(23 23 28 / 0.32);
}`;

type ScrollAxis = {
  readonly isVertical: boolean;
  readonly thumb: HTMLElement;
};

function createThumb(frameDocument: Document) {
  const thumb = frameDocument.createElement('div');
  thumb.className = THUMB_CLASS;
  frameDocument.body.appendChild(thumb);
  return thumb;
}

function scrollRange(container: HTMLElement, { isVertical }: ScrollAxis) {
  return isVertical
    ? { offset: container.scrollTop, viewport: container.clientHeight, content: container.scrollHeight }
    : { offset: container.scrollLeft, viewport: container.clientWidth, content: container.scrollWidth };
}

/** Track length along the axis, leaving the corner free when both thumbs can show. */
function trackLength(container: HTMLElement, axis: ScrollAxis) {
  const bounds = container.getBoundingClientRect();
  const length = axis.isVertical ? bounds.height : bounds.width;
  return length - THUMB_EDGE_INSET_PX * 2 - THUMB_THICKNESS_PX;
}

function placeThumb(container: HTMLElement, axis: ScrollAxis) {
  const { offset, viewport, content } = scrollRange(container, axis);
  const { thumb } = axis;
  thumb.hidden = content <= viewport;
  if (thumb.hidden) return;

  const bounds = container.getBoundingClientRect();
  const track = trackLength(container, axis);
  const length = Math.max(THUMB_MIN_LENGTH_PX, (track * viewport) / content);
  const position = THUMB_EDGE_INSET_PX + ((track - length) * offset) / (content - viewport);
  const crossPosition = (axis.isVertical ? bounds.right : bounds.bottom) - THUMB_EDGE_INSET_PX - THUMB_THICKNESS_PX;

  Object.assign(thumb.style, axis.isVertical
    ? { left: `${crossPosition}px`, top: `${bounds.top + position}px`, width: `${THUMB_THICKNESS_PX}px`, height: `${length}px` }
    : { left: `${bounds.left + position}px`, top: `${crossPosition}px`, width: `${length}px`, height: `${THUMB_THICKNESS_PX}px` });
}

function enableThumbDrag(container: HTMLElement, axis: ScrollAxis) {
  const { thumb } = axis;
  let lastPointer = 0;
  const pointerCoordinate = (event: PointerEvent) => (axis.isVertical ? event.clientY : event.clientX);

  thumb.addEventListener('pointerdown', event => {
    event.preventDefault();
    thumb.setPointerCapture(event.pointerId);
    thumb.classList.add(DRAGGING_CLASS);
    lastPointer = pointerCoordinate(event);
  });
  thumb.addEventListener('pointermove', event => {
    if (!thumb.hasPointerCapture(event.pointerId)) return;
    const { viewport, content } = scrollRange(container, axis);
    const thumbLength = axis.isVertical ? thumb.offsetHeight : thumb.offsetWidth;
    // Thumb travel maps linearly onto the scrollable range.
    const scrollPerPixel = (content - viewport) / (trackLength(container, axis) - thumbLength);
    const delta = (pointerCoordinate(event) - lastPointer) * scrollPerPixel;
    lastPointer = pointerCoordinate(event);
    if (axis.isVertical) container.scrollTop += delta;
    else container.scrollLeft += delta;
  });
  const endDrag = () => thumb.classList.remove(DRAGGING_CLASS);
  thumb.addEventListener('pointerup', endDrag);
  thumb.addEventListener('pointercancel', endDrag);
}

/** Replaces the canvas scrollbars with overlay thumbs that show only while the view is moving. */
export function autoHideCanvasScrollbar(container: HTMLElement) {
  const frameDocument = container.ownerDocument;
  const style = frameDocument.createElement('style');
  style.textContent = CANVAS_SCROLLBAR_STYLE;
  frameDocument.head.appendChild(style);

  const axes: ScrollAxis[] = [
    { isVertical: true, thumb: createThumb(frameDocument) },
    { isVertical: false, thumb: createThumb(frameDocument) },
  ];
  axes.forEach(axis => enableThumbDrag(container, axis));

  let hideTimer: number | undefined;
  container.addEventListener('scroll', () => {
    for (const axis of axes) {
      placeThumb(container, axis);
      axis.thumb.classList.add(SCROLLING_CLASS);
    }
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      for (const axis of axes) axis.thumb.classList.remove(SCROLLING_CLASS);
    }, SCROLLBAR_IDLE_HIDE_MS);
  }, { passive: true });
}
