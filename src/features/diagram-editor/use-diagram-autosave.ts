import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { saveDiagram } from '../../entities/project/project-api';
import { storeDiagramXml, storeProject } from '../../entities/project/project-query';
import { log, serializeError } from '../../shared/lib/logger';
import type { DiagramExport, DiagramSession } from './drawio-editor-frame';

const AUTOSAVE_DEBOUNCE_MS = 800;
// draw.io crops exports to the cells' geometry, which clips strokes, shadows and overflowing labels.
const SNAPSHOT_BORDER_PX = 10;

type SnapshotFormat = 'svg' | 'png';

/**
 * Debounces draw.io autosave events into full snapshots (xml + svg + png) sent to the server.
 *
 * Saves never overlap: a change made while a save is in flight triggers one more save afterwards.
 * The returned callbacks are stable, so the editor session is not reopened while the project stays open.
 */
export function useDiagramAutosave(projectId: string, sessionRef: RefObject<DiagramSession | null>) {
  const pendingExportRef = useRef(new Map<SnapshotFormat, (exported: DiagramExport) => void>());
  const debounceTimerRef = useRef<number | undefined>(undefined);
  const isSavingRef = useRef(false);
  const hasUnsavedChangeRef = useRef(false);
  const queryClient = useQueryClient();

  const exportSnapshot = useCallback((format: SnapshotFormat) => new Promise<DiagramExport>(resolve => {
    pendingExportRef.current.set(format, resolve);
    // Shared renditions are embedded in third-party pages, so they must not carry a page background.
    sessionRef.current?.exportDiagram({ format, transparent: true, border: String(SNAPSHOT_BORDER_PX) });
  }), [sessionRef]);

  const saveLatestSnapshot = useCallback(async () => {
    if (isSavingRef.current) {
      hasUnsavedChangeRef.current = true;
      return;
    }
    isSavingRef.current = true;
    try {
      do {
        hasUnsavedChangeRef.current = false;
        const svgExport = await exportSnapshot('svg');
        const pngExport = await exportSnapshot('png');
        const savedProject = await saveDiagram(projectId, { xml: svgExport.xml, svg: svgExport.data, png: pngExport.data });
        storeProject(queryClient, savedProject);
        storeDiagramXml(queryClient, projectId, svgExport.xml);
        log('debug', 'DiagramEditor', 'Diagram autosaved', { projectId });
      } while (hasUnsavedChangeRef.current);
      // draw.io blocks page unload with its own "unsaved changes" prompt until told the diagram is saved.
      sessionRef.current?.markSaved();
    } catch (error) {
      log('error', 'DiagramEditor', 'Diagram autosave failed', { projectId, ...serializeError(error) });
    } finally {
      isSavingRef.current = false;
    }
  }, [sessionRef, exportSnapshot, projectId, queryClient]);

  const handleAutoSave = useCallback(() => {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(saveLatestSnapshot, AUTOSAVE_DEBOUNCE_MS);
  }, [saveLatestSnapshot]);

  const handleExport = useCallback((exported: DiagramExport) => {
    const format = exported.format as SnapshotFormat;
    pendingExportRef.current.get(format)?.(exported);
    pendingExportRef.current.delete(format);
  }, []);

  useEffect(() => () => window.clearTimeout(debounceTimerRef.current), []);

  return { handleAutoSave, handleExport };
}
