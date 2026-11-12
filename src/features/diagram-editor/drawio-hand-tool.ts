import type { DrawioEditorUi, MxMouseEvent } from './drawio-editor-bridge';

export type HandToolTitles = { select: string; hand: string };

const HAND_MODE_CLASS = 'mu-hand-mode';
const LEFT_MOUSE_BUTTON = 0;
// Plain H, as in Figma; draw.io only binds Ctrl+Shift+H (fit window).
const TOGGLE_KEY_CODE = 72;

// NOTE: draw.io's simple-theme toolbar uses its "thin" icons: Material Symbols at the 48px optical
// size, weight 300 (stroke 2.25/48), drawn at a 24px background size. The toggle must use that same
// optical size, weight and render size; the 24px optical size draws a bigger, heavier glyph.
const ICON_RENDER_SIZE = '24px';
// lucide's MousePointer2 at stroke 1.125/24, i.e. the thin icons' 2.25/48: Material's
// arrow_selector_tool has a tail that looks clumsy at this size.
const SELECT_ICON = toIconUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.125" stroke-linejoin="round"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/></svg>');
// Material Symbols Outlined pan_tool, optical size 48, weight 300.
const HAND_ICON = toIconUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M419.31-70q-25.17 0-48.08-11.65-22.91-11.64-37.15-33.28L82.85-486.08l13.46-10.61q14.31-12.7 33.54-15.54 19.23-2.85 37.93 11.43L300-403.15v-383q0-9.65 6.58-16.17 6.58-6.52 16.31-6.52 9.73 0 16.11 6.52 6.39 6.52 6.39 16.17v469.92L164.08-447.31l208.07 306.85q7.77 12.15 20 18.61 12.24 6.46 27.16 6.46h258q41.07 0 69.19-28.11 28.11-28.12 28.11-69.19v-544.62q0-9.64 6.59-16.16 6.58-6.53 16.3-6.53 9.73 0 16.11 6.53 6.39 6.52 6.39 16.16v544.62q0 59.92-41.39 101.3Q737.23-70 677.31-70h-258Zm39.23-420v-376.15q0-9.65 6.58-16.17 6.58-6.52 16.31-6.52 9.72 0 16.11 6.52 6.38 6.52 6.38 16.17V-490h-45.38Zm158.54 0v-336.15q0-9.65 6.58-16.17 6.58-6.52 16.3-6.52 9.73 0 16.12 6.52 6.38 6.52 6.38 16.17V-490h-45.38ZM469.54-302.69Z"/></svg>');

// Figma-sized: its hand cursor is about 18px with a hairline white rim.
const CURSOR_SIZE_PX = 18;
const CURSOR_HOTSPOT = `${CURSOR_SIZE_PX / 2} ${CURSOR_SIZE_PX / 2}`;

// lucide's Hand and HandGrab, drawn as cursors because Windows' own grab cursors look crude.
// The rect fills the palm so the white backing has no hole on dark diagrams.
const OPEN_HAND_CURSOR = toCursorImage(
  '<rect x="6" y="8" width="13" height="11"/>',
  '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>' +
  '<path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/>' +
  '<path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/>' +
  '<path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
);
const CLOSED_HAND_CURSOR = toCursorImage(
  '<rect x="4" y="9" width="15" height="10"/>',
  '<path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4"/>' +
  '<path d="M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/>' +
  '<path d="M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5"/>' +
  '<path d="M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>' +
  '<path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0"/>',
);

// Shapes set their own cursors, so the hand cursor must override every descendant.
// The first declaration is the fallback for browsers that reject image-set() in `cursor`.
const HAND_MODE_STYLE = `
.${HAND_MODE_CLASS}, .${HAND_MODE_CLASS} * {
  cursor: ${OPEN_HAND_CURSOR.standard} ${CURSOR_HOTSPOT}, grab !important;
  cursor: ${OPEN_HAND_CURSOR.sharp} ${CURSOR_HOTSPOT}, grab !important;
}
.${HAND_MODE_CLASS}:active, .${HAND_MODE_CLASS}:active * {
  cursor: ${CLOSED_HAND_CURSOR.standard} ${CURSOR_HOTSPOT}, grabbing !important;
  cursor: ${CLOSED_HAND_CURSOR.sharp} ${CURSOR_HOTSPOT}, grabbing !important;
}`;

function toIconUrl(svg: string) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Black lines over a filled white silhouette, so the cursor stays visible on any background.
 *
 * NOTE: Browsers rasterize an SVG cursor at its intrinsic size, so on a 125%/150% Windows display a
 * single image is upscaled and its anti-aliased rim turns blurry; `sharp` adds a 2x rendition.
 */
function toCursorImage(palmFill: string, linePaths: string) {
  const renderAt = (sizePx: number) => toIconUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="-1 -1 26 26" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<g stroke="white" stroke-width="2.6" fill="white">${palmFill}${linePaths}</g>` +
    `<g stroke="black" stroke-width="1.2">${linePaths}</g></svg>`,
  );
  const standard = renderAt(CURSOR_SIZE_PX);
  return { standard, sharp: `image-set(${standard} 1x, ${renderAt(CURSOR_SIZE_PX * 2)} 2x)` };
}

/**
 * Puts a select/hand toggle first in draw.io's top toolbar. In hand mode a left drag pans the view,
 * even over shapes, through the same hook draw.io uses for Space+drag.
 */
export function installHandTool(editorUi: DrawioEditorUi, titles: HandToolTitles) {
  const { graph, graph: { panningHandler } } = editorUi.editor;
  const frameDocument = graph.container.ownerDocument;
  let isHandMode = false;

  // NOTE: Force panning runs before every other mouse handler, so selection, moving and rubberband never start.
  const isForcePanningEvent = panningHandler.isForcePanningEvent;
  panningHandler.isForcePanningEvent = function (mouseEvent: MxMouseEvent) {
    return (isHandMode && mouseEvent.getEvent().button === LEFT_MOUSE_BUTTON) || isForcePanningEvent.call(this, mouseEvent);
  };
  // Hides the blue "connect" arrows that hovering a shape would show.
  const isHoverIconsResetEvent = editorUi.hoverIcons.isResetEvent;
  editorUi.hoverIcons.isResetEvent = function (event: MouseEvent, allowShift?: boolean) {
    return isHandMode || isHoverIconsResetEvent.call(this, event, allowShift);
  };

  const style = frameDocument.createElement('style');
  style.textContent = HAND_MODE_STYLE;
  frameDocument.head.appendChild(style);

  const toggleButton = frameDocument.createElement('a');
  toggleButton.className = 'geButton';
  toggleButton.style.backgroundSize = ICON_RENDER_SIZE;
  const renderToggleButton = () => {
    toggleButton.style.backgroundImage = isHandMode ? HAND_ICON : SELECT_ICON;
    toggleButton.title = isHandMode ? titles.hand : titles.select;
    graph.container.classList.toggle(HAND_MODE_CLASS, isHandMode);
  };
  const toggleHandMode = () => {
    isHandMode = !isHandMode;
    renderToggleButton();
  };
  toggleButton.addEventListener('click', toggleHandMode);
  // draw.io's key handler already skips keys while a label is being edited or a dialog is open.
  editorUi.keyHandler.bindKey(TOGGLE_KEY_CODE, toggleHandMode);
  renderToggleButton();

  const toolbar = editorUi.sketchPickerMenuElt;
  const keepToggleButtonFirst = () => {
    if (toolbar.firstChild !== toggleButton) toolbar.prepend(toggleButton);
  };
  // draw.io empties and refills this toolbar on resize, reload and language change.
  new MutationObserver(keepToggleButtonFirst).observe(toolbar, { childList: true });
  keepToggleButtonFirst();
}
