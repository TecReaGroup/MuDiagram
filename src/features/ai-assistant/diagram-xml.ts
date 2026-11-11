export type CellOperation = {
  operation: 'update' | 'add' | 'delete';
  cell_id: string;
  new_xml?: string;
};

const ROOT_CELLS = '<mxCell id="0"/><mxCell id="1" parent="0"/>';

function parseXml(xml: string, what: string): Document {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parseError = document.querySelector('parsererror');
  if (parseError) throw new Error(`${what} is not well-formed XML: ${parseError.textContent?.trim().split('\n')[0]}`);
  return document;
}

// draw.io may store a page compressed: base64(deflateRaw(encodeURIComponent(xml))).
async function inflatePage(compressed: string): Promise<string> {
  const bytes = Uint8Array.from(atob(compressed.trim()), character => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return decodeURIComponent(await new Response(stream).text());
}

function firstPage(mxfile: Document): Element {
  const page = mxfile.querySelector('diagram');
  if (!page) throw new Error('The diagram has no page');
  return page;
}

async function readFirstPageModel(mxfile: Document): Promise<Element> {
  const page = firstPage(mxfile);
  const inlineModel = page.querySelector('mxGraphModel');
  if (inlineModel) return inlineModel;
  return parseXml(await inflatePage(page.textContent ?? ''), 'Compressed page').documentElement;
}

/** Returns the first page as a plain <mxGraphModel>, the form the AI reads and edits. */
export async function readGraphModelXml(mxfileXml: string): Promise<string> {
  const model = await readFirstPageModel(parseXml(mxfileXml, 'Diagram'));
  return new XMLSerializer().serializeToString(model);
}

/** Wraps the cells produced by display_diagram into a complete single-page draw.io file. */
export function wrapCellsAsMxfile(cellsXml: string): string {
  const mxfileXml = `<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root>${ROOT_CELLS}${cellsXml}</root></mxGraphModel></diagram></mxfile>`;
  parseXml(mxfileXml, 'Generated diagram');
  return mxfileXml;
}

// A cell is either a bare <mxCell> or an <object>/<UserObject> wrapping one;
// the id sits on the outer element, parent/source/target on the inner mxCell.
function innerCell(element: Element): Element {
  return element.tagName === 'mxCell' ? element : element.querySelector(':scope > mxCell') ?? element;
}

function findCell(root: Element, cellId: string): Element | undefined {
  return Array.from(root.children).find(element => element.getAttribute('id') === cellId);
}

function deleteWithDependents(root: Element, cellId: string) {
  const doomedIds = new Set([cellId]);
  let foundMore = true;
  while (foundMore) {
    foundMore = false;
    for (const element of Array.from(root.children)) {
      const id = element.getAttribute('id');
      if (!id || doomedIds.has(id)) continue;
      const cell = innerCell(element);
      if (['parent', 'source', 'target'].some(name => doomedIds.has(cell.getAttribute(name) ?? ''))) {
        doomedIds.add(id);
        foundMore = true;
      }
    }
  }
  for (const element of Array.from(root.children)) {
    if (doomedIds.has(element.getAttribute('id') ?? '')) element.remove();
  }
}

function importCell(owner: Document, operation: CellOperation): Element {
  if (!operation.new_xml) throw new Error(`${operation.operation} of cell ${operation.cell_id} needs new_xml`);
  const cell = parseXml(operation.new_xml, `new_xml of cell ${operation.cell_id}`).documentElement;
  if (cell.getAttribute('id') !== operation.cell_id) {
    throw new Error(`new_xml id "${cell.getAttribute('id')}" does not match cell_id "${operation.cell_id}"`);
  }
  return owner.importNode(cell, true);
}

/**
 * Applies edit_diagram operations to the first page.
 *
 * Returns:
 *   The whole mxfile with the first page stored uncompressed; other pages are kept as is.
 *
 * Raises:
 *   Error: a referenced cell is missing or an XML fragment is invalid; nothing is applied.
 */
export async function applyCellOperations(mxfileXml: string, operations: CellOperation[]): Promise<string> {
  const mxfile = parseXml(mxfileXml, 'Diagram');
  const model = mxfile.importNode(await readFirstPageModel(mxfile), true) as Element;
  const root = model.querySelector('root');
  if (!root) throw new Error('The diagram has no <root>');

  for (const operation of operations) {
    const existing = findCell(root, operation.cell_id);
    if (operation.operation === 'delete') {
      if (!existing) throw new Error(`Cannot delete: cell ${operation.cell_id} not found`);
      deleteWithDependents(root, operation.cell_id);
    } else if (operation.operation === 'update') {
      if (!existing) throw new Error(`Cannot update: cell ${operation.cell_id} not found`);
      existing.replaceWith(importCell(mxfile, operation));
    } else {
      if (existing) throw new Error(`Cannot add: cell ${operation.cell_id} already exists`);
      root.appendChild(importCell(mxfile, operation));
    }
  }

  firstPage(mxfile).replaceChildren(model);
  return new XMLSerializer().serializeToString(mxfile);
}
