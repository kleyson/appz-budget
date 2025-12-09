import { ReactNode, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  iconBgClass?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  icon,
  iconBgClass = 'bg-primary-500/10 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400',
  children,
  footer,
}: ModalProps) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <div className="flex items-center gap-3">
              {icon && <div className={`p-2.5 rounded-xl ${iconBgClass}`}>{icon}</div>}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
