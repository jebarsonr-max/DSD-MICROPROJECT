import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aviation-navyDark/40 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-white w-full ${maxWidth} rounded-xl border border-aviation-border shadow-elevated overflow-hidden animate-scale-up`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-aviation-border bg-[#FAFCFE]">
          <div>
            <h3 className="text-lg font-semibold text-aviation-navy">{title}</h3>
            {subtitle && <p className="text-xs text-aviation-textSecondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-aviation-textSecondary hover:text-aviation-navy hover:bg-[#EAF3FC] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

