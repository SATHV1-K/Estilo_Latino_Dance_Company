import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-brand-yellow mb-2 text-sm">
          {label} <span className="text-red-500">*</span>
        </label>
      )}
      <input
        className={`w-full h-11 px-4 bg-white text-brand-black border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow
          placeholder:text-gray-400 transition-all duration-200
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-brand-yellow mb-2 text-sm">
          {label} <span className="text-red-500">*</span>
        </label>
      )}
      <textarea
        className={`w-full min-h-24 px-4 py-3 bg-white text-brand-black border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow
          placeholder:text-gray-400 transition-all duration-200 resize-none
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}`}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}