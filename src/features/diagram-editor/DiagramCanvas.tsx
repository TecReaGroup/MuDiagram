import { useState } from 'react';
import { DrawIoEmbed } from 'react-drawio';
import type { DiagramDocument } from './use-diagram-document';

const EDITOR_URL_PARAMETERS = {
  ui: 'kennedy',
  spin: true,
  libraries: true,
  noExitBtn: true,
  saveAndExit: false,
} as const;

type DiagramCanvasProps = {
  initialXml: string;
  diagram: DiagramDocument;
};

export function DiagramCanvas({ initialXml, diagram }: DiagramCanvasProps) {
  // react-drawio reloads the canvas whenever `xml` changes; later updates go through diagram.replaceXml.
  const [embedXml] = useState(initialXml);
  return (
    <DrawIoEmbed
      ref={diagram.drawioRef}
      xml={embedXml}
      autosave
      urlParameters={EDITOR_URL_PARAMETERS}
      {...diagram.embedHandlers}
    />
  );
}
