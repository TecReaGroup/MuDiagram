import { useId } from 'react';
import { useI18n } from '../../shared/i18n/language-context';
import { buttonClass } from '../../shared/ui/control-class';
import { Modal } from '../../shared/ui/Modal';
import { DiagramPreview } from '../diagram-editor/DiagramPreview';

type CheckpointPreviewModalProps = {
  /** The checkpoint's mxfile xml; null keeps the modal closed. */
  checkpointXml: string | null;
  onClose: () => void;
  onRestore: (checkpointXml: string) => void;
};

/** Shows a checkpoint read-only; only "Restore" puts it on the canvas. */
export function CheckpointPreviewModal({ checkpointXml, onClose, onRestore }: CheckpointPreviewModalProps) {
  const { t } = useI18n();
  const titleId = useId();

  const restore = () => {
    onRestore(checkpointXml!);
    onClose();
  };

  return (
    <Modal
      isOpen={checkpointXml !== null}
      onClose={onClose}
      labelledBy={titleId}
      className="h-[min(720px,calc(100vh-48px))] w-[min(1080px,calc(100vw-32px))] p-5"
    >
      {/* Layout lives on this wrapper: `flex` on the <dialog> would override its closed `display: none`. */}
      <div className="flex h-full flex-col gap-4">
        <div>
          <h2 id={titleId} className="text-base font-semibold">{t('ai.checkpointTitle')}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t('ai.checkpointDescription')}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-line">
          <DiagramPreview xml={checkpointXml!} />
        </div>
        <div className="flex justify-between gap-2">
          <button type="button" onClick={onClose} autoFocus className={buttonClass('secondary', 'lg')}>
            {t('common.cancel')}
          </button>
          <button type="button" onClick={restore} className={buttonClass('primary', 'lg')}>
            {t('ai.restoreCheckpoint')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
