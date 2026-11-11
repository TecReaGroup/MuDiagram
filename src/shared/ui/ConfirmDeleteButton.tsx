import { TriangleAlert } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { useI18n } from '../i18n/language-context';
import { buttonClass, MODAL_DIALOG_CLASS } from './control-class';

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function close() {
    dialogRef.current?.close();
  }

  function confirm() {
    close();
    onConfirm();
  }

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} aria-label={label} title={label} className={className}>
        {children}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        // A click whose target is the <dialog> itself landed on the backdrop.
        onClick={event => event.target === dialogRef.current && close()}
        className={`${MODAL_DIALOG_CLASS} w-[min(420px,calc(100vw-32px))] p-6`}
      >
        <div className="flex gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="text-base font-semibold">{title}</h2>
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
      </dialog>
    </>
  );
}
