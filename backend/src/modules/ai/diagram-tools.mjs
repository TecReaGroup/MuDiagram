import { tool } from 'ai';
import { z } from 'zod';

// Ported from next-ai-draw-io (lib/chat-tools.ts), using plain mxCell + mxGeometry
// instead of its compact x/y/w/h shorthand so no server-side expansion is needed.
// Both tools have no `execute`: the browser applies them to the draw.io canvas
// and reports the outcome back as the tool output.
export const diagramTools = {
  display_diagram: tool({
    description: `Replace the whole canvas with a new diagram. Pass ONLY mxCell elements - the <mxfile>, <mxGraphModel>, <root> wrappers and the root cells id="0" and id="1" are added automatically.

Rules (the XML is rejected if violated):
1. Only mxCell elements (an mxCell with custom data may be wrapped in <object>), all siblings, never nested
2. Do NOT include cells id="0" or id="1"
3. Every mxCell has a unique id, starting from "2"
4. Top-level cells use parent="1"; shapes inside a container use parent="<container id>"
5. Shapes have vertex="1" and <mxGeometry x y width height as="geometry"/>
6. Edges have edge="1", source, target and <mxGeometry relative="1" as="geometry"/>
7. Escape special characters in attribute values: &lt; &gt; &amp; &quot;

Example:
<mxCell id="2" value="API Gateway" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="140" height="60" as="geometry"/></mxCell>
<mxCell id="3" value="Service" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="280" y="40" width="140" height="60" as="geometry"/></mxCell>
<mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;html=1;exitX=1;exitY=0.5;entryX=0;entryY=0.5;" edge="1" parent="1" source="2" target="3"><mxGeometry relative="1" as="geometry"/></mxCell>`,
    inputSchema: z.object({
      xml: z.string().describe('Sibling mxCell elements, without wrapper tags or root cells'),
    }),
    outputSchema: z.string(),
  }),
  edit_diagram: tool({
    description: `Edit the current diagram with id-based operations.

- update: replace the cell with id cell_id by new_xml (the complete mxCell, including mxGeometry)
- add: append new_xml as a new cell; cell_id is its new unique id
- delete: remove the cell; its children and the edges attached to it are removed too

Every " inside new_xml must be escaped as \\" in the JSON arguments.

Example: {"operations": [{"operation": "update", "cell_id": "3", "new_xml": "<mxCell id=\\"3\\" value=\\"Auth Service\\" style=\\"rounded=1;whiteSpace=wrap;html=1;\\" vertex=\\"1\\" parent=\\"1\\"><mxGeometry x=\\"280\\" y=\\"40\\" width=\\"140\\" height=\\"60\\" as=\\"geometry\\"/></mxCell>"}]}`,
    inputSchema: z.object({
      operations: z.array(z.object({
        operation: z.enum(['update', 'add', 'delete']),
        cell_id: z.string().describe('The id of the mxCell; must match the id in new_xml'),
        new_xml: z.string().optional().describe('Complete mxCell element, required for update and add'),
      })),
    }),
    outputSchema: z.string(),
  }),
};
