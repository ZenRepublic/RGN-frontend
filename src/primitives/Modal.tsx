import type { ReactNode } from 'react';
import { ImageButton } from './buttons/ImageButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  disabled?: boolean;
}

export function Modal({ isOpen, onClose, title, children, disabled = false }: ModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (!disabled) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <ImageButton onClick={onClose} disabled={disabled} ariaLabel="Close modal">
            <img src="/Icons/CloseIcon.PNG" alt="Close" />
          </ImageButton>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
