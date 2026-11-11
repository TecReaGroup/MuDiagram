import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DrawIoEmbedRef, EventAutoSave, EventExport } from 'react-drawio';
import { saveDiagram, type Project } from '../../entities/project/project-api';
import { log, serializeError } from '../../shared/lib/logger';

const AUTOSAVE_DELAY_MS = 1500;
const EXPORT_TIMEOUT_MS = 30_000;

type ImageExportFormat = 'xmlsvg' | 'xmlpng';
export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'failed';

/**
 * Owns one project's diagram while it is open: the latest XML, the draw.io
 * iframe bridge, and saving the XML together with SVG/PNG snapshots.
 *
 * Saves are single-flight: changes arriving mid-save trigger exactly one more
 * save afterwards, so at most one export per format is ever in flight.
 */
export function useDiagramDocument(projectId: string, initialXml: string, onSaved: (project: Project) => void) {
  const drawioRef = useRef<DrawIoEmbedRef>(null);
  const latestXmlRef = useRef(initialXml);
  const pendingExportsRef = useRef(new Map<ImageExportFormat, (dataUrl: string) => void>());
  const autosaveTimerRef = useRef<number>();
  const savingRef = useRef<Promise<void> | null>(null);
  const changedDuringSaveRef = useRef(false);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  // draw.io drops load() calls sent before its iframe reports the first load.
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  const exportImage = useCallback((format: ImageExportFormat) => new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pendingExportsRef.current.delete(format);
      reject(new Error(`draw.io did not answer the ${format} export`));
    }, EXPORT_TIMEOUT_MS);
    pendingExportsRef.current.set(format, dataUrl => {
      window.clearTimeout(timeout);
      resolve(dataUrl);
    });
    drawioRef.current?.exportDiagram({ format, border: '20', background: '#ffffff' });
  }), []);

  const saveNow = useCallback(async (): Promise<void> => {
    window.clearTimeout(autosaveTimerRef.current);
    if (savingRef.current) {
      changedDuringSaveRef.current = true;
      return savingRef.current;
    }
    setSaveStatus('saving');
    const xml = latestXmlRef.current;
    savingRef.current = (async () => {
      const svgDataUrl = await exportImage('xmlsvg');
      const pngDataUrl = await exportImage('xmlpng');
      onSavedRef.current(await saveDiagram(projectId, { xml, svgDataUrl, pngDataUrl }));
    })()
      .then(() => setSaveStatus(changedDuringSaveRef.current ? 'unsaved' : 'saved'))
      .catch(error => {
        setSaveStatus('failed');
        log('error', 'DiagramEditor', 'Diagram save failed', { projectId, ...serializeError(error) });
      })
      .finally(() => {
        savingRef.current = null;
        if (changedDuringSaveRef.current) {
          changedDuringSaveRef.current = false;
          void saveNow();
        }
      });
    return savingRef.current;
  }, [exportImage, projectId]);

  const recordChange = useCallback((xml: string) => {
    latestXmlRef.current = xml;
    setSaveStatus('unsaved');
    window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => void saveNow(), AUTOSAVE_DELAY_MS);
  }, [saveNow]);

  /** Puts a whole new diagram on the canvas (used by the AI tools) and saves it. */
  const replaceXml = useCallback((xml: string) => {
    drawioRef.current?.load({ xml, autosave: true });
    recordChange(xml);
  }, [recordChange]);

  const readXml = useCallback(() => latestXmlRef.current, []);

  useEffect(() => () => window.clearTimeout(autosaveTimerRef.current), []);

  const recordChangeRef = useRef(recordChange);
  recordChangeRef.current = recordChange;
  const saveNowRef = useRef(saveNow);
  saveNowRef.current = saveNow;

  // react-drawio subscribes to iframe messages once, on mount, so these handlers
  // must stay stable and reach the latest callbacks through refs.
  // Its onSave fires for every export with an image instead of XML, so the
  // editor's Save button is recognized from the export's parentEvent instead.
  const embedHandlers = useMemo(() => ({
    onLoad: () => setIsCanvasReady(true),
    onAutoSave: (event: EventAutoSave) => recordChangeRef.current(event.xml),
    onExport: (event: EventExport) => {
      if (event.message.parentEvent === 'save') {
        void saveNowRef.current();
        return;
      }
      const format = event.format as ImageExportFormat;
      pendingExportsRef.current.get(format)?.(event.data);
      pendingExportsRef.current.delete(format);
    },
  }), []);

  return { drawioRef, embedHandlers, isCanvasReady, saveStatus, readXml, replaceXml, saveNow };
}

export type DiagramDocument = ReturnType<typeof useDiagramDocument>;
