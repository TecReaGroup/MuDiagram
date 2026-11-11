import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { DrawIoEmbed, type DrawIoEmbedRef, type EventAutoSave, type EventLoad } from 'react-drawio';
import { getDiagramXml } from '../../entities/project/project-api';
import { useI18n } from '../../shared/i18n/language-context';
import { log, serializeError } from '../../shared/lib/logger';
import { EDITOR_BASE_URL } from './drawio-editor-url';
import { connectDrawioEditor, type DrawioEditorBridge, type SelectedCell } from './drawio-editor-bridge';
import { DrawioLoadingFrame } from './DrawioLoadingFrame';
import { DRAWIO_CONFIGURATION } from './drawio-theme';
import { useDiagramAutosave } from './use-diagram-autosave';

const MODULE = 'DiagramEditor';

// Saving is automatic, so draw.io's Save / Exit buttons and its "unsaved changes" status are hidden.
// A project is a single-page diagram: `pages=0` hides the page menu while only one page exists.
const EDITOR_URL_PARAMETERS = {
  ui: 'simple',
  pages: false,
  spin: false,
  libraries: true,
  noSaveBtn: true,
  saveAndExit: false,
  noExitBtn: true,
  modified: false,
} as const;

export type DiagramCanvasHandle = {
  /** The mxfile xml currently on the canvas, including edits not saved yet; empty until loaded. */
  readXml: () => string;
  /** Replaces the whole diagram as one step that Ctrl+Z undoes, and saves it. */
  loadXml: (xml: string) => void;
  /** The cells selected on the canvas right now; empty until the editor is ready. */
  readSelection: () => SelectedCell[];
};

export const DiagramCanvas = forwardRef<DiagramCanvasHandle, { projectId: string }>(function DiagramCanvas({ projectId }, ref) {
  const editorRef = useRef<DrawIoEmbedRef>(null);
  const frameHostRef = useRef<HTMLDivElement>(null);
  // undefined: not tried yet; null: draw.io internals missing, so edits fall back to a full load.
  const editorBridgeRef = useRef<DrawioEditorBridge | null | undefined>(undefined);
  // NOTE: Only the initially loaded xml is passed to the editor; react-drawio reloads the whole
  // diagram whenever the `xml` prop changes, so saved xml is never fed back.
  const [initialXml, setInitialXml] = useState<string | null>(null);
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);
  const latestXmlRef = useRef('');
  const { handleAutoSave, handleExport } = useDiagramAutosave(projectId, editorRef);
  const { t } = useI18n();

  useEffect(() => {
    let isCurrent = true;
    getDiagramXml(projectId).then(
      xml => {
        if (!isCurrent) return;
        latestXmlRef.current = xml;
        setInitialXml(xml);
      },
      error => log('error', MODULE, 'Failed to load diagram', { projectId, ...serializeError(error) }),
    );
    return () => { isCurrent = false; };
  }, [projectId]);

  useImperativeHandle(ref, () => ({
    readXml: () => latestXmlRef.current,
    loadXml: xml => {
      latestXmlRef.current = xml;
      // A full `load` would also wipe draw.io's undo history.
      if (editorBridgeRef.current) editorBridgeRef.current.replaceDiagram(xml);
      else editorRef.current?.load({ xml, autosave: true });
      handleAutoSave();
    },
    readSelection: () => editorBridgeRef.current?.readSelection() ?? [],
  }), [handleAutoSave]);

  // Both callbacks must stay stable: react-drawio subscribes to iframe messages only once.
  // draw.io reports `load` after every loadXml too, but the iframe and its editor stay the same.
  const handleEditorLoad = useCallback((event: EventLoad) => {
    latestXmlRef.current = event.xml;
    setIsEditorLoaded(true);
    const frameWindow = frameHostRef.current?.querySelector('iframe')?.contentWindow;
    if (editorBridgeRef.current !== undefined || !frameWindow) return;
    editorBridgeRef.current = connectDrawioEditor(frameWindow);
    if (!editorBridgeRef.current) {
      log('warn', MODULE, 'draw.io internals not found; AI edits cannot be undone and the selection is not shared');
      return;
    }
    editorBridgeRef.current.installHandTool({ select: t('editor.selectTool'), hand: t('editor.handTool') });
  }, [t]);
  const handleCanvasChange = useCallback((event: EventAutoSave) => {
    latestXmlRef.current = event.xml;
    handleAutoSave();
  }, [handleAutoSave]);

  return (
    <DrawioLoadingFrame isLoaded={isEditorLoaded}>
      {initialXml !== null && (
        <div ref={frameHostRef} className="size-full">
          <DrawIoEmbed
            ref={editorRef}
            xml={initialXml}
            autosave
            baseUrl={EDITOR_BASE_URL}
            urlParameters={EDITOR_URL_PARAMETERS}
            configuration={DRAWIO_CONFIGURATION}
            onLoad={handleEditorLoad}
            onAutoSave={handleCanvasChange}
            onExport={handleExport}
          />
        </div>
      )}
    </DrawioLoadingFrame>
  );
});
