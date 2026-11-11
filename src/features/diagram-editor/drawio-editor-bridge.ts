// Direct access to the draw.io editor in our same-origin iframe. draw.io has no public JavaScript
// API for embedders, so everything here relies on its internals (pinned in script/fetch-drawio.mjs).

import { installHandTool, type HandToolTitles } from './drawio-hand-tool';

export type SelectedCell = { id: string; label: string };

export type DrawioEditorBridge = {
  readSelection: () => SelectedCell[];
  /** Puts the diagram of an mxfile on the canvas as one step that Ctrl+Z undoes. */
  replaceDiagram: (mxfileXml: string) => void;
  /** Adds the select/hand toggle to draw.io's top toolbar; call once per editor. */
  installHandTool: (titles: HandToolTitles) => void;
};

type MxCell = { id: string };
export type MxMouseEvent = { getEvent: () => MouseEvent };
type MxGraph = {
  container: HTMLElement;
  panningHandler: { isForcePanningEvent: (mouseEvent: MxMouseEvent) => boolean };
  getSelectionCells: () => MxCell[];
  convertValueToString: (cell: MxCell) => string;
  addListener: (eventName: string, listener: () => void) => void;
};
type MxEventObjectConstructor = new (eventName: string) => object;
export type DrawioEditorUi = {
  editor: { graph: MxGraph };
  hoverIcons: { isResetEvent: (event: MouseEvent, allowShift?: boolean) => boolean };
  // The top-center toolbar of the "simple" UI; draw.io rebuilds its children on resize and reload.
  sketchPickerMenuElt: HTMLElement;
  // Executes draw.io's undoable ReplaceDiagram change on the current page.
  replaceDiagramData: (graphModelXml: string) => void;
  fireEvent: (event: object) => void;
};
type DrawioWindow = Window & {
  Draw?: { loadPlugin?: (plugin: (editorUi: DrawioEditorUi) => void) => void };
  mxEventObject: MxEventObjectConstructor;
};

/** Cell labels are HTML (`html=1`); the model only needs their text. */
function toPlainText(html: string) {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '';
}

/**
 * NOTE: The embed keeps the graph disabled until the diagram arrives, so draw.io builds the top
 * toolbar's text/rectangle/freehand/insert buttons as disabled (greyed out) and never rebuilds them
 * on `enabledChanged`; "lockedChanged" is one of the events that does rebuild that toolbar.
 */
function keepPickerToolbarInSyncWithGraph(frameWindow: DrawioWindow, editorUi: DrawioEditorUi) {
  const rebuildPickerToolbar = () => editorUi.fireEvent(new frameWindow.mxEventObject('lockedChanged'));
  editorUi.editor.graph.addListener('enabledChanged', rebuildPickerToolbar);
  rebuildPickerToolbar();
}

function readGraphModelXml(mxfileXml: string) {
  const graphModel = new DOMParser().parseFromString(mxfileXml, 'application/xml').querySelector('mxGraphModel');
  if (!graphModel) throw new Error('The diagram has no uncompressed <mxGraphModel>');
  return new XMLSerializer().serializeToString(graphModel);
}

/**
 * Connects to the editor once draw.io has started; null when its internals are missing.
 *
 * NOTE: draw.io keeps its EditorUi in a closure. Once started it swaps `Draw.loadPlugin` for a
 * version that calls the plugin with the EditorUi at once, which is the one supported way in.
 */
export function connectDrawioEditor(frameWindow: Window): DrawioEditorBridge | null {
  let editorUi: DrawioEditorUi | null = null;
  (frameWindow as DrawioWindow).Draw?.loadPlugin?.(connectedEditorUi => { editorUi = connectedEditorUi; });
  const connectedEditorUi = editorUi as DrawioEditorUi | null;
  if (!connectedEditorUi || typeof connectedEditorUi.replaceDiagramData !== 'function') return null;

  keepPickerToolbarInSyncWithGraph(frameWindow as DrawioWindow, connectedEditorUi);
  const { graph } = connectedEditorUi.editor;
  return {
    readSelection: () => graph.getSelectionCells().map(cell => ({
      id: String(cell.id),
      label: toPlainText(graph.convertValueToString(cell)),
    })),
    replaceDiagram: mxfileXml => connectedEditorUi.replaceDiagramData(readGraphModelXml(mxfileXml)),
    installHandTool: titles => installHandTool(connectedEditorUi, titles),
  };
}
