import { TriangleAlert } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/language-context';
import { buttonClass } from './control-class';
import { Modal } from './Modal';
import { DIALOG_TITLE_CLASS } from './text-class';

type ConfirmDeleteButtonProps = {
  label: string;
  title: string;
  description: string;
  onConfirm: () => void;
  className: string;
  children: ReactNode;
};

export function ConfirmDeleteButton({ label, title, description, onConfirm, className, children }: ConfirmDeleteButtonProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const close = () => setIsOpen(false);

  function confirm() {
    close();
    onConfirm();
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} aria-label={label} title={label} className={className}>
        {children}
      </button>

      <Modal isOpen={isOpen} onClose={close} labelledBy={titleId} describedBy={descriptionId} className="w-[min(420px,calc(100vw-32px))] p-6">
        <div className="flex gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className={DIALOG_TITLE_CLASS}>{title}</h2>
            <p id={descriptionId} className="mt-1.5 text-sm wrap-break-word text-ink-muted">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-between gap-2">
          <button type="button" onClick={close} autoFocus className={buttonClass('secondary', 'lg')}>
            {t('common.cancel')}
          </button>
          <button type="button" onClick={confirm} className={buttonClass('destructive', 'lg')}>
            {t('common.delete')}
          </button>
        </div>
      </Modal>
    </>
  );
}
