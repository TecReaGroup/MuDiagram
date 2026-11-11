import { useEffect, useRef, type ReactNode } from 'react';
import { MODAL_DIALOG_CLASS } from './control-class';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  /** Size and padding; the surface, shadow and backdrop come from MODAL_DIALOG_CLASS. */
  className: string;
  children: ReactNode;
};

/**
 * Controlled native <dialog>. Children mount only while open, so a form inside
 * starts from fresh initial values on every opening.
 */
export function Modal({ isOpen, onClose, labelledBy, describedBy, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      // Escape closes the dialog natively; report it so the owner's state follows.
      onClose={onClose}
      // A click whose target is the <dialog> itself landed on the backdrop.
      onClick={event => event.target === dialogRef.current && onClose()}
      className={`${MODAL_DIALOG_CLASS} ${className}`}
    >
      {isOpen && children}
    </dialog>
  );
}
