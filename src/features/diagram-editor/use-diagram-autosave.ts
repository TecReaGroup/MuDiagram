import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { DrawIoEmbedRef, EventExport } from 'react-drawio';
import { saveDiagram } from '../../entities/project/project-api';
import { log, serializeError } from '../../shared/lib/logger';

const AUTOSAVE_DEBOUNCE_MS = 800;

type SnapshotFormat = 'svg' | 'png';

/**
 * Debounces draw.io autosave events into full snapshots (xml + svg + png) sent to the server.
 *
 * Saves never overlap: a change made while a save is in flight triggers one more save afterwards.
 * The returned callbacks are stable because react-drawio subscribes to iframe messages only once.
 */
export function useDiagramAutosave(projectId: string, editorRef: RefObject<DrawIoEmbedRef | null>) {
  const pendingExportRef = useRef(new Map<SnapshotFormat, (exported: EventExport) => void>());
  const debounceTimerRef = useRef<number | undefined>(undefined);
  const isSavingRef = useRef(false);
  const hasUnsavedChangeRef = useRef(false);

  const exportSnapshot = useCallback((format: SnapshotFormat) => new Promise<EventExport>(resolve => {
    pendingExportRef.current.set(format, resolve);
    // Shared renditions are embedded in third-party pages, so they must not carry a page background.
    editorRef.current?.exportDiagram({ format, transparent: true });
  }), [editorRef]);

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
        await saveDiagram(projectId, { xml: svgExport.xml, svg: svgExport.data, png: pngExport.data });
        log('debug', 'DiagramEditor', 'Diagram autosaved', { projectId });
      } while (hasUnsavedChangeRef.current);
      // draw.io blocks page unload with its own "unsaved changes" prompt until told the diagram is saved.
      editorRef.current?.status({ message: '', modified: false });
    } catch (error) {
      log('error', 'DiagramEditor', 'Diagram autosave failed', { projectId, ...serializeError(error) });
    } finally {
      isSavingRef.current = false;
    }
  }, [editorRef, exportSnapshot, projectId]);

  const handleAutoSave = useCallback(() => {
    window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(saveLatestSnapshot, AUTOSAVE_DEBOUNCE_MS);
  }, [saveLatestSnapshot]);

  const handleExport = useCallback((exported: EventExport) => {
    const format = exported.format as SnapshotFormat;
    pendingExportRef.current.get(format)?.(exported);
    pendingExportRef.current.delete(format);
  }, []);

  useEffect(() => () => window.clearTimeout(debounceTimerRef.current), []);

  return { handleAutoSave, handleExport };
}
