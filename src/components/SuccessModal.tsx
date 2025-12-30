import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from './Button';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  autoClose = true,
  autoCloseDelay = 2500
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-black/90 flex items-center justify-center z-50 px-6 animate-fade-in">
      <div className="bg-brand-white rounded-2xl p-8 max-w-sm w-full text-center relative">
        {!autoClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        )}
        <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <Check size={40} className="text-brand-black" strokeWidth={3} />
        </div>
        <h2 className="text-brand-black text-2xl font-bold mb-3">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        {!autoClose && (
          <Button onClick={onClose}>Close</Button>
        )}
      </div>
    </div>
  );
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function ErrorModal({ isOpen, onClose, title, message }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-black/90 flex items-center justify-center z-50 px-6">
      <div className="bg-brand-white rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <X size={40} className="text-error" strokeWidth={3} />
        </div>
        <h2 className="text-brand-black text-2xl font-bold mb-3">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'yellow' | 'white' | 'black';
}

export function LoadingSpinner({ size = 'medium', color = 'yellow' }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4'
  };

  const colorClasses = {
    yellow: 'border-brand-yellow border-t-transparent',
    white: 'border-brand-white border-t-transparent',
    black: 'border-brand-black border-t-transparent'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`} />
  );
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-brand-black/90 flex items-center justify-center z-50 px-6">
      <div className="text-center">
        <LoadingSpinner size="large" color="yellow" />
        <p className="text-brand-white mt-4">{message}</p>
      </div>
    </div>
  );
}
