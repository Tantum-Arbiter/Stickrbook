import { ReactNode, useEffect, useCallback, MouseEvent } from 'react';
import { createPortal } from 'react-dom';

export type ModalVariant = 'default' | 'wide' | 'fullscreen';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title */
  title?: ReactNode;
  /** Modal content */
  children: ReactNode;
  /** Footer content (usually action buttons) */
  footer?: ReactNode;
  /** Modal size variant */
  variant?: ModalVariant;
  /** Whether clicking the overlay closes the modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** Additional class name for the modal */
  className?: string;
}

/**
 * Modal component with overlay and keyboard handling.
 * Uses the extracted CSS from the legacy storyboard.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = 'default',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Handle overlay click
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalClassNames = [
    'modal',
    variant !== 'default' && `modal--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const modalContent = (
    <div className="modal-overlay open" onClick={handleOverlayClick}>
      <div className={modalClassNames} role="dialog" aria-modal="true">
        {title && <h2>{title}</h2>}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default Modal;

