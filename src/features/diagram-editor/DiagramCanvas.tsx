import { useEffect, useRef, useState } from 'react';
import { DrawIoEmbed, type DrawIoEmbedRef } from 'react-drawio';
import { getDiagramXml } from '../../entities/project/project-api';
import { log, serializeError } from '../../shared/lib/logger';
import { DRAWIO_CONFIGURATION } from './drawio-theme';
import { useDiagramAutosave } from './use-diagram-autosave';

// Saving is automatic, so draw.io's Save / Exit buttons and its "unsaved changes" status are hidden.
// A project is a single-page diagram: `pages=0` hides the page menu while only one page exists.
const EDITOR_URL_PARAMETERS = {
  ui: 'simple',
  pages: false,
  spin: true,
  libraries: true,
  noSaveBtn: true,
  saveAndExit: false,
  noExitBtn: true,
  modified: false,
} as const;

export function DiagramCanvas({ projectId }: { projectId: string }) {
  const editorRef = useRef<DrawIoEmbedRef>(null);
  // NOTE: Only the initially loaded xml is passed to the editor; react-drawio reloads the whole
  // diagram whenever the `xml` prop changes, so saved xml is never fed back.
  const [initialXml, setInitialXml] = useState<string | null>(null);
  const { handleAutoSave, handleExport } = useDiagramAutosave(projectId, editorRef);

  useEffect(() => {
    let isCurrent = true;
    getDiagramXml(projectId).then(
      xml => { if (isCurrent) setInitialXml(xml); },
      error => log('error', 'DiagramEditor', 'Failed to load diagram', { projectId, ...serializeError(error) }),
    );
    return () => { isCurrent = false; };
  }, [projectId]);

  if (initialXml === null) return null;

  return (
    <DrawIoEmbed
      ref={editorRef}
      xml={initialXml}
      autosave
      urlParameters={EDITOR_URL_PARAMETERS}
      configuration={DRAWIO_CONFIGURATION}
      onAutoSave={handleAutoSave}
      onExport={handleExport}
    />
  );
}
