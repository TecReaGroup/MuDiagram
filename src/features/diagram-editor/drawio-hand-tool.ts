import type { DrawioEditorUi, MxMouseEvent } from './drawio-editor-bridge';

export type HandToolTitles = { select: string; hand: string };

const HAND_MODE_CLASS = 'mu-hand-mode';
const LEFT_MOUSE_BUTTON = 0;

// Icons are black, like draw.io's own toolbar icons, which its dark mode inverts. Both are drawn
// at the ~1px line weight of draw.io's "thin" icons so the toggle reads as part of that toolbar.
// lucide's MousePointer2: Material's arrow_selector_tool has a tail that looks clumsy at this size.
const SELECT_ICON = toIconUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1" stroke-linejoin="round"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/></svg>');
// Material Symbols Outlined pan_tool, weight 200.
const HAND_ICON = toIconUrl('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M436.62-100q-24.94 0-46.55-11.19-21.61-11.19-36.3-32.35l-245-359.15 8.61-8.39q12.85-12.84 30.39-13.92t32.38 9.31L320-418.54v-339.15q0-8.5 5.76-14.25t14.27-5.75q8.51 0 14.24 5.75t5.73 14.25v416.23L183.54-464.69l203.15 298.23q8.08 12.61 21.31 19.54 13.23 6.92 28.62 6.92H660q42.23 0 71.12-28.88Q760-197.77 760-240v-500q0-8.5 5.76-14.25t14.27-5.75q8.51 0 14.24 5.75T800-740v500q0 58.31-40.85 99.15Q718.31-100 660-100H436.62Zm30.3-400v-337.69q0-8.5 5.76-14.25t14.27-5.75q8.51 0 14.24 5.75t5.73 14.25V-500h-40Zm146.93 0v-297.69q0-8.5 5.75-14.25 5.76-5.75 14.27-5.75t14.25 5.75q5.73 5.75 5.73 14.25V-500h-40Zm-141.7 180Z"/></svg>');

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
  const renderToggleButton = () => {
    toggleButton.style.backgroundImage = isHandMode ? HAND_ICON : SELECT_ICON;
    toggleButton.title = isHandMode ? titles.hand : titles.select;
    graph.container.classList.toggle(HAND_MODE_CLASS, isHandMode);
  };
  toggleButton.addEventListener('click', () => {
    isHandMode = !isHandMode;
    renderToggleButton();
  });
  renderToggleButton();

  const toolbar = editorUi.sketchPickerMenuElt;
  const keepToggleButtonFirst = () => {
    if (toolbar.firstChild !== toggleButton) toolbar.prepend(toggleButton);
  };
  // draw.io empties and refills this toolbar on resize, reload and language change.
  new MutationObserver(keepToggleButtonFirst).observe(toolbar, { childList: true });
  keepToggleButtonFirst();
}
