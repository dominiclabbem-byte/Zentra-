import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import RenderProfiler from './RenderProfiler';

export default function Modal({
  title,
  children,
  onClose,
  hideHeader = false,
  align = 'center',
  panelClassName = '',
  bodyClassName = '',
}) {
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const modalContent = (
    <RenderProfiler id={`Modal:${title}`}>
      <div
        className={`fixed inset-0 z-50 flex justify-center bg-brand-ink/50 backdrop-blur-sm p-4 animate-fade-in modal-overlay ${
          align === 'top' ? 'items-start overflow-y-auto' : 'items-center'
        }`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={`transform-gpu bg-white rounded-2xl shadow-2xl shadow-brand-ink/20 w-full max-w-md max-h-[90vh] flex flex-col animate-fade-in-up overscroll-contain modal-shell ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {!hideHeader && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold text-brand-ink">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className={hideHeader ? bodyClassName : `px-6 py-5 overflow-y-auto overscroll-contain ${bodyClassName}`}>{children}</div>
        </div>
      </div>
    </RenderProfiler>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
