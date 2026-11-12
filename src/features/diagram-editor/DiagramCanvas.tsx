import { useQueryClient } from '@tanstack/react-query';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { diagramXmlQuery } from '../../entities/project/project-query';
import { useI18n } from '../../shared/i18n/language-context';
import { log, serializeError } from '../../shared/lib/logger';
import type { SelectedCell } from './drawio-editor-bridge';
import { openDrawioEditor, warmUpDrawioEditor, type DiagramSession } from './drawio-editor-frame';
import { DrawioLoadingIndicator } from './DrawioLoadingFrame';
import { useDiagramAutosave } from './use-diagram-autosave';

const MODULE = 'DiagramEditor';

export type DiagramCanvasHandle = {
  /** The mxfile xml currently on the canvas, including edits not saved yet; empty until loaded. */
  readXml: () => string;
  /** Replaces the whole diagram as one step that Ctrl+Z undoes, and saves it; waits for the editor if it is still loading. */
  loadXml: (xml: string) => void;
  /** Fits and centers the diagram on the canvas, as it is when a project opens. */
  fitDiagram: () => void;
  /** The cells selected on the canvas right now; empty until the editor is ready. */
  readSelection: () => SelectedCell[];
};

/** The area the tab's shared draw.io editor is laid over while this project is open. */
export const DiagramCanvas = forwardRef<DiagramCanvasHandle, { projectId: string }>(function DiagramCanvas({ projectId }, ref) {
  const slotRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<DiagramSession | null>(null);
  const latestXmlRef = useRef('');
  // A diagram handed over before draw.io finished loading the project; replacing it earlier would be lost.
  const queuedXmlRef = useRef<string | null>(null);
  const [isDiagramLoaded, setIsDiagramLoaded] = useState(false);
  const { handleAutoSave, handleExport } = useDiagramAutosave(projectId, sessionRef);
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // fetchQuery, not useQuery: the editor takes the xml once, and a background refetch must not reload it.
  useEffect(() => {
    // Opening a project directly skips the library's idle warm-up; draw.io then starts alongside the fetch.
    warmUpDrawioEditor();
    let isCurrent = true;
    queryClient.fetchQuery(diagramXmlQuery(projectId)).then(
      xml => {
        if (!isCurrent) return;
        latestXmlRef.current = queuedXmlRef.current ?? xml;
        sessionRef.current = openDrawioEditor({
          slot: slotRef.current!,
          xml,
          handToolTitles: { select: t('editor.selectTool'), hand: t('editor.handTool') },
          listener: {
            onLoad: loadedXml => {
              setIsDiagramLoaded(true);
              const queuedXml = queuedXmlRef.current;
              queuedXmlRef.current = null;
              if (queuedXml === null) {
                latestXmlRef.current = loadedXml;
                return;
              }
              sessionRef.current!.replaceDiagram(queuedXml);
              sessionRef.current!.fitDiagram();
              handleAutoSave();
            },
            onChange: changedXml => {
              latestXmlRef.current = changedXml;
              handleAutoSave();
            },
            onExport: handleExport,
          },
        });
      },
      error => log('error', MODULE, 'Failed to load diagram', { projectId, ...serializeError(error) }),
    );
    return () => {
      isCurrent = false;
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, [projectId, queryClient, t, handleAutoSave, handleExport]);

  useImperativeHandle(ref, () => ({
    readXml: () => latestXmlRef.current,
    loadXml: xml => {
      latestXmlRef.current = xml;
      if (!isDiagramLoaded) {
        queuedXmlRef.current = xml;
        return;
      }
      sessionRef.current!.replaceDiagram(xml);
      handleAutoSave();
    },
    fitDiagram: () => sessionRef.current?.fitDiagram(),
    readSelection: () => sessionRef.current?.readSelection() ?? [],
  }), [handleAutoSave, isDiagramLoaded]);

  // The slot is positioned and comes after the fixed editor iframe in the DOM, so it paints above it;
  // without pointer-events-none it would swallow every click meant for the canvas.
  return (
    <div ref={slotRef} className="pointer-events-none relative size-full rounded-[inherit]">
      {!isDiagramLoaded && <DrawioLoadingIndicator />}
    </div>
  );
});
