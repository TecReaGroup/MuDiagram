// One draw.io editor for the whole tab. Starting draw.io means evaluating ~10 MB of JavaScript and
// building its UI, which took seconds on every project visit; now it starts once (ideally while the
// library is idle) and opening a project only posts that project's xml into the running editor.
//
// NOTE: An iframe reloads whenever it is moved in the DOM, so it never moves: it stays fixed at the
// top of <body> and is laid over the open project's slot element instead of being rendered inside it.

import { log } from '../../shared/lib/logger';
import { connectDrawioEditor, type DrawioEditorBridge, type SelectedCell } from './drawio-editor-bridge';
import { EDITOR_BASE_URL } from './drawio-editor-url';
import type { HandToolTitles } from './drawio-hand-tool';
import { DRAWIO_CONFIGURATION } from './drawio-theme';

const MODULE = 'DrawioEditorFrame';

// Saving is automatic, so draw.io's Save / Exit buttons and its "unsaved changes" status are hidden.
// A project is a single-page diagram: `pages=0` hides the page menu while only one page exists.
const EDITOR_URL_PARAMETERS = {
  embed: true,
  proto: 'json',
  configure: true,
  ui: 'simple',
  pages: false,
  spin: false,
  libraries: true,
  noSaveBtn: true,
  saveAndExit: false,
  noExitBtn: true,
  modified: false,
} as const;
const REVEAL_TRANSITION = 'opacity 300ms';
// draw.io's window.onerror skips only Chrome's old wording of this benign notice; this wording
// (current Chrome and Firefox) would otherwise pop up its "Error:" dialog.
const RESIZE_OBSERVER_LOOP_MESSAGE = 'ResizeObserver loop completed with undelivered notifications.';

export type DiagramExportRequest = { format: 'svg' | 'png'; transparent: boolean; border: string };
export type DiagramExport = { format: string; data: string; xml: string };

export type DiagramListener = {
  /** The session's diagram is on the canvas; called again after each later full load. */
  onLoad: (xml: string) => void;
  onChange: (xml: string) => void;
  onExport: (exported: DiagramExport) => void;
};

export type DiagramSession = {
  /** The cells selected on the canvas; empty until draw.io's internals are connected. */
  readSelection: () => SelectedCell[];
  /** Replaces the whole diagram as one step that Ctrl+Z undoes, or as a full load without internals. */
  replaceDiagram: (xml: string) => void;
  /** Fits and centers the diagram on the canvas; does nothing without draw.io's internals. */
  fitDiagram: () => void;
  exportDiagram: (request: DiagramExportRequest) => void;
  /** Clears draw.io's "unsaved changes" state, which otherwise blocks page unload. */
  markSaved: () => void;
  /** Hides the editor; events that arrive afterwards are dropped. */
  close: () => void;
};

type OpenRequest = {
  /** The element the editor is laid over; its size and border radius are followed. */
  slot: HTMLElement;
  xml: string;
  /** Used once, when the first diagram loads and the hand tool is installed. */
  handToolTitles: HandToolTitles;
  listener: DiagramListener;
};
type ActiveSession = OpenRequest & { stopFollowingSlot: () => void };
type EditorMessage = { event?: string; xml?: string; format?: string; data?: string };

let frame: HTMLIFrameElement | null = null;
let frameCreatedAt = 0;
let isEditorInitialized = false;
// Messages are ordered, so events that arrive before draw.io acknowledges the latest `load` belong
// to an earlier diagram (an autosave or export of the previous project) and must not reach this one.
let unacknowledgedLoadCount = 0;
// undefined: not tried yet; null: draw.io internals missing, so replacing falls back to a full load.
let bridge: DrawioEditorBridge | null | undefined;
let activeSession: ActiveSession | null = null;

function buildEditorUrl() {
  const url = new URL(EDITOR_BASE_URL);
  for (const [name, value] of Object.entries(EDITOR_URL_PARAMETERS)) {
    url.searchParams.set(name, typeof value === 'boolean' ? (value ? '1' : '0') : value);
  }
  return url.href;
}

function postToEditor(action: string, payload: object = {}) {
  frame!.contentWindow!.postMessage(JSON.stringify({ action, ...payload }), window.location.origin);
}

function loadDiagram(xml: string) {
  unacknowledgedLoadCount++;
  postToEditor('load', { xml, autosave: true });
}

function connectBridge(handToolTitles: HandToolTitles) {
  bridge = connectDrawioEditor(frame!.contentWindow!);
  if (!bridge) {
    log('warn', MODULE, 'draw.io internals not found; AI edits cannot be undone and the selection is not shared');
    return;
  }
  bridge.installHandTool(handToolTitles);
}

function followSlot(slot: HTMLElement) {
  const placeOverSlot = () => {
    const bounds = slot.getBoundingClientRect();
    Object.assign(frame!.style, {
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      borderRadius: getComputedStyle(slot).borderRadius,
    });
  };
  // Also fires once right away, which does the first placement.
  const resizeObserver = new ResizeObserver(placeOverSlot);
  resizeObserver.observe(slot);
  window.addEventListener('resize', placeOverSlot);
  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', placeOverSlot);
  };
}

function closeActiveSession() {
  if (!activeSession) return;
  activeSession.stopFollowingSlot();
  activeSession = null;
  Object.assign(frame!.style, { visibility: 'hidden', opacity: '0' });
  // Unsaved edits are dropped with the session, as when the editor iframe used to be destroyed;
  // draw.io would otherwise keep its unload prompt armed for the rest of the tab's life.
  if (isEditorInitialized) postToEditor('status', { message: '', modified: false });
}

function handleEditorMessage(event: MessageEvent) {
  // The checkpoint preview runs a second draw.io on this origin, so only the source tells them apart.
  if (event.source !== frame?.contentWindow || typeof event.data !== 'string') return;
  let message: EditorMessage;
  try {
    message = JSON.parse(event.data);
  } catch {
    return;
  }

  switch (message.event) {
    case 'configure':
      postToEditor('configure', { config: DRAWIO_CONFIGURATION });
      break;
    case 'init':
      isEditorInitialized = true;
      log('info', MODULE, 'draw.io editor started', { startupMs: Math.round(performance.now() - frameCreatedAt) });
      if (activeSession) loadDiagram(activeSession.xml);
      break;
    case 'load':
      unacknowledgedLoadCount = Math.max(0, unacknowledgedLoadCount - 1);
      if (!activeSession) break;
      if (bridge === undefined) connectBridge(activeSession.handToolTitles);
      if (unacknowledgedLoadCount > 0) break;
      bridge?.fitDiagram();
      frame!.style.opacity = '1';
      activeSession.listener.onLoad(message.xml!);
      break;
    case 'autosave':
      if (activeSession && unacknowledgedLoadCount === 0) activeSession.listener.onChange(message.xml!);
      break;
    case 'export':
      if (activeSession && unacknowledgedLoadCount === 0) {
        activeSession.listener.onExport({ format: message.format!, data: message.data!, xml: message.xml! });
      }
      break;
  }
}

/**
 * A capture listener on the window itself runs before the `onerror` handler draw.io assigns,
 * so the notice never reaches it; real errors pass through untouched.
 */
function ignoreResizeObserverLoopNotice(frameWindow: Window) {
  frameWindow.addEventListener('error', event => {
    if (event.message === RESIZE_OBSERVER_LOOP_MESSAGE) event.stopImmediatePropagation();
  }, { capture: true });
}

/** Starts draw.io in a hidden iframe if it is not running yet; safe to call any number of times. */
export function warmUpDrawioEditor() {
  if (frame) return;
  frame = document.createElement('iframe');
  frame.title = 'draw.io';
  frame.allow = 'clipboard-read; clipboard-write';
  // Explicit viewport size: a replaced element ignores `inset` and would lay draw.io out at 300×150.
  Object.assign(frame.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '100vw',
    height: '100vh',
    border: '0',
    visibility: 'hidden',
    opacity: '0',
    transition: REVEAL_TRANSITION,
  });
  window.addEventListener('message', handleEditorMessage);
  frame.addEventListener('load', () => ignoreResizeObserverLoopNotice(frame!.contentWindow!), { once: true });
  frame.src = buildEditorUrl();
  frameCreatedAt = performance.now();
  // First in <body>: the app's own positioned overlays (popovers, side panels) still paint above it.
  document.body.prepend(frame);
  log('info', MODULE, 'Starting draw.io editor in the background');
}

/** Shows the editor over `slot` with the given diagram; the previous session, if any, is closed. */
export function openDrawioEditor(request: OpenRequest): DiagramSession {
  warmUpDrawioEditor();
  closeActiveSession();
  const session: ActiveSession = { ...request, stopFollowingSlot: followSlot(request.slot) };
  activeSession = session;
  frame!.style.visibility = 'visible';
  if (isEditorInitialized) loadDiagram(request.xml);

  return {
    readSelection: () => bridge?.readSelection() ?? [],
    replaceDiagram: xml => {
      if (bridge) bridge.replaceDiagram(xml);
      else loadDiagram(xml);
    },
    fitDiagram: () => bridge?.fitDiagram(),
    exportDiagram: exportRequest => postToEditor('export', exportRequest),
    markSaved: () => postToEditor('status', { message: '', modified: false }),
    close: () => {
      if (activeSession === session) closeActiveSession();
    },
  };
}
