// Browser side of the tools declared in backend/src/modules/ai/diagram-tools.mjs; the two must
// stay in sync. Error messages are sent back to the model as tool output so it can fix its call.

const ROOT_CELL_IDS = new Set(['0', '1']);
const CELL_REFERENCE_ATTRIBUTES = ['parent', 'source', 'target'] as const;

export type CellOperation = {
  operation: 'update' | 'add' | 'delete';
  cell_id: string;
  new_xml?: string;
};

export type DiagramChatTools = {
  display_diagram: { input: { xml: string }; output: string };
  edit_diagram: { input: { operations: CellOperation[] }; output: string };
};

export type DiagramToolCall =
  | { toolName: 'display_diagram'; input: DiagramChatTools['display_diagram']['input'] }
  | { toolName: 'edit_diagram'; input: DiagramChatTools['edit_diagram']['input'] };

export const DIAGRAM_TOOL_SUCCESS_OUTPUT: Record<keyof DiagramChatTools, string> = {
  display_diagram: 'The diagram is now on the canvas.',
  edit_diagram: 'The edits are applied to the canvas.',
};

function parseXml(xml: string, subject: string): Document {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = document.querySelector('parsererror');
  if (parserError) throw new Error(`${subject} is not well-formed XML: ${parserError.textContent?.trim()}`);
  return document;
}

// draw.io's compressed form: the <diagram> text is base64(deflateRaw(encodeURIComponent(xml))).
async function inflateDiagramText(compressedText: string): Promise<string> {
  const bytes = Uint8Array.from(atob(compressedText), character => character.charCodeAt(0));
  const inflated = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return decodeURIComponent(await new Response(inflated).text());
}

/** Parses the canvas mxfile, inflating a diagram that draw.io saved compressed. */
async function parseCanvasMxfile(canvasXml: string): Promise<Document> {
  const mxfile = parseXml(canvasXml, 'The canvas diagram');
  // NOTE: Diagrams saved before `compressXml: false` took effect are still compressed on disk.
  const diagram = mxfile.querySelector('diagram');
  const compressedText = diagram && !diagram.querySelector('mxGraphModel') ? diagram.textContent?.trim() : '';
  if (diagram && compressedText) {
    const graphModel = parseXml(await inflateDiagramText(compressedText), 'The compressed canvas diagram').documentElement;
    diagram.replaceChildren(mxfile.importNode(graphModel, true));
    mxfile.documentElement.removeAttribute('compressed');
  }
  return mxfile;
}

function findGraphModel(mxfile: Document): Element {
  const graphModel = mxfile.querySelector('mxGraphModel');
  if (!graphModel?.querySelector(':scope > root')) throw new Error('The canvas diagram has no <mxGraphModel><root>');
  return graphModel;
}

const idOf = (cell: Element) => cell.getAttribute('id') ?? '';

// A cell with custom data is an <object>/<UserObject> wrapping the mxCell that holds parent/source/target.
const graphCellOf = (cell: Element) => cell.tagName === 'mxCell' ? cell : cell.querySelector('mxCell') ?? cell;

function parseCells(cellsXml: string): Element[] {
  const fragment = parseXml(`<cells>${cellsXml}</cells>`, 'The cell XML');
  // NOTE: Models sometimes repeat the <mxGraphModel><root> wrappers and root cells despite the tool description.
  const container = fragment.querySelector('root') ?? fragment.documentElement;
  return [...container.children].filter(cell => !ROOT_CELL_IDS.has(idOf(cell)));
}

function assertConsistentCells(root: Element) {
  const ids = new Set<string>();
  for (const cell of root.children) {
    const id = idOf(cell);
    if (!id) throw new Error(`Every cell needs an id: ${new XMLSerializer().serializeToString(cell).slice(0, 160)}`);
    if (ids.has(id)) throw new Error(`Duplicate cell id "${id}"`);
    ids.add(id);
  }
  for (const cell of root.children) {
    for (const attribute of CELL_REFERENCE_ATTRIBUTES) {
      const referencedId = graphCellOf(cell).getAttribute(attribute);
      if (referencedId && !ids.has(referencedId)) {
        throw new Error(`Cell "${idOf(cell)}" has ${attribute}="${referencedId}", but no cell has that id`);
      }
    }
  }
}

function replaceAllCells(root: Element, cellsXml: string) {
  for (const cell of [...root.children]) {
    if (!ROOT_CELL_IDS.has(idOf(cell))) cell.remove();
  }
  root.append(...parseCells(cellsXml).map(cell => root.ownerDocument.importNode(cell, true)));
}

/** Removes the cell together with its descendants and every edge attached to any of them. */
function deleteCellTree(root: Element, cellId: string) {
  const doomedIds = new Set([cellId]);
  let hasGrown = true;
  while (hasGrown) {
    hasGrown = false;
    for (const cell of root.children) {
      if (doomedIds.has(idOf(cell))) continue;
      const isAttached = CELL_REFERENCE_ATTRIBUTES.some(attribute => doomedIds.has(graphCellOf(cell).getAttribute(attribute) ?? ''));
      if (isAttached) {
        doomedIds.add(idOf(cell));
        hasGrown = true;
      }
    }
  }
  for (const cell of [...root.children]) {
    if (doomedIds.has(idOf(cell))) cell.remove();
  }
}

function parseSingleCell(operation: CellOperation): Element {
  if (!operation.new_xml) throw new Error(`The ${operation.operation} of cell "${operation.cell_id}" needs new_xml`);
  const cells = parseCells(operation.new_xml);
  if (cells.length !== 1) throw new Error(`new_xml for cell "${operation.cell_id}" must contain exactly one cell`);
  if (idOf(cells[0]) !== operation.cell_id) {
    throw new Error(`new_xml has id "${idOf(cells[0])}" but cell_id is "${operation.cell_id}"`);
  }
  return cells[0];
}

function applyCellOperations(root: Element, operations: CellOperation[]) {
  for (const operation of operations) {
    const existingCell = [...root.children].find(cell => idOf(cell) === operation.cell_id);
    if (operation.operation === 'add') {
      if (existingCell) throw new Error(`Cannot add cell "${operation.cell_id}": the id is already used`);
      root.append(root.ownerDocument.importNode(parseSingleCell(operation), true));
      continue;
    }
    if (!existingCell || ROOT_CELL_IDS.has(operation.cell_id)) {
      throw new Error(`Cannot ${operation.operation} cell "${operation.cell_id}": no such cell on the canvas`);
    }
    if (operation.operation === 'update') existingCell.replaceWith(root.ownerDocument.importNode(parseSingleCell(operation), true));
    else deleteCellTree(root, operation.cell_id);
  }
}

/**
 * Applies a diagram tool call to the canvas xml.
 *
 * The call is all-or-nothing: the canvas xml is parsed fresh, so a failure part way through
 * leaves nothing behind.
 *
 * Returns:
 *     The new mxfile xml to load on the canvas.
 *
 * Raises:
 *     Error: The call is invalid; the message explains why, for the model.
 */
export async function applyDiagramToolCall(canvasXml: string, toolCall: DiagramToolCall): Promise<string> {
  const mxfile = await parseCanvasMxfile(canvasXml);
  const root = findGraphModel(mxfile).querySelector(':scope > root')!;
  if (toolCall.toolName === 'display_diagram') replaceAllCells(root, toolCall.input.xml);
  else applyCellOperations(root, toolCall.input.operations);
  assertConsistentCells(root);
  return new XMLSerializer().serializeToString(mxfile);
}

/** The <mxGraphModel> of the canvas, which is all the model needs to see of the mxfile. */
export async function readGraphModelXml(canvasXml: string): Promise<string> {
  return new XMLSerializer().serializeToString(findGraphModel(await parseCanvasMxfile(canvasXml)));
}
