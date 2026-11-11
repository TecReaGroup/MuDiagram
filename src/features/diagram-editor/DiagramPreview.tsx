import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { DrawIoEmbed, type DrawIoEmbedRef, type EventExport } from 'react-drawio';
import { EDITOR_BASE_URL } from './drawio-editor-url';
import { DrawioLoadingFrame } from './DrawioLoadingFrame';
import { DRAWIO_CONFIGURATION } from './drawio-theme';

// `chrome=0` loads the lightest draw.io: it only renders the diagram so it can be exported as SVG.
// Declared apart from the JSX because react-drawio's parameter type does not list `chrome`.
const RENDERER_URL_PARAMETERS = { chrome: false, spin: false };
const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
// Scale factor per wheel delta pixel; exponential so zooming in and back out lands on the same scale.
const WHEEL_ZOOM_SPEED = 0.0015;

type Point = { x: number; y: number };
type Viewport = Point & { scale: number };

const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 };

/**
 * Read-only SVG view of a diagram: drag pans, the wheel zooms around the cursor.
 * The live canvas is never touched.
 *
 * NOTE: draw.io's own viewer pans by scrolling and feels sluggish, so a hidden draw.io frame only
 * renders the diagram to SVG and the viewport is ours.
 */
export function DiagramPreview({ xml }: { xml: string }) {
  const rendererRef = useRef<DrawIoEmbedRef>(null);
  const viewportElementRef = useRef<HTMLDivElement>(null);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT);
  const dragStartRef = useRef<{ pointer: Point; viewport: Viewport } | null>(null);

  const exportSvg = useCallback(() => rendererRef.current?.exportDiagram({ format: 'svg' }), []);
  const showExportedSvg = useCallback((exported: EventExport) => setSvgUrl(exported.data), []);

  // React registers wheel listeners as passive, so only a native one can stop the dialog from scrolling.
  useEffect(() => {
    const viewportElement = viewportElementRef.current;
    if (!viewportElement) return;
    const zoomAtCursor = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = viewportElement.getBoundingClientRect();
      // The image is centered in the viewport and scales around its own center.
      const cursor = { x: event.clientX - bounds.left - bounds.width / 2, y: event.clientY - bounds.top - bounds.height / 2 };
      setViewport(current => {
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED)));
        const ratio = scale / current.scale;
        // Keeps the diagram point under the cursor fixed while the scale changes.
        return { scale, x: cursor.x - (cursor.x - current.x) * ratio, y: cursor.y - (cursor.y - current.y) * ratio };
      });
    };
    viewportElement.addEventListener('wheel', zoomAtCursor, { passive: false });
    return () => viewportElement.removeEventListener('wheel', zoomAtCursor);
  }, [svgUrl]);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = { pointer: { x: event.clientX, y: event.clientY }, viewport };
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;
    setViewport({
      ...dragStart.viewport,
      x: dragStart.viewport.x + event.clientX - dragStart.pointer.x,
      y: dragStart.viewport.y + event.clientY - dragStart.pointer.y,
    });
  };
  const endDrag = () => {
    dragStartRef.current = null;
  };

  return (
    <DrawioLoadingFrame isLoaded={svgUrl !== null}>
      {svgUrl === null ? (
        // `invisible` (not `hidden`) keeps the frame laid out, which draw.io needs to render.
        <div className="invisible size-full">
          <DrawIoEmbed
            ref={rendererRef}
            xml={xml}
            baseUrl={EDITOR_BASE_URL}
            urlParameters={RENDERER_URL_PARAMETERS}
            configuration={DRAWIO_CONFIGURATION}
            onLoad={exportSvg}
            onExport={showExportedSvg}
          />
        </div>
      ) : (
        <div
          ref={viewportElementRef}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          // `move` while dragging, like panning the draw.io canvas.
          className="flex size-full touch-none select-none items-center justify-center overflow-hidden p-6 active:cursor-move"
        >
          <img
            src={svgUrl}
            alt=""
            draggable={false}
            style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </DrawioLoadingFrame>
  );
}
