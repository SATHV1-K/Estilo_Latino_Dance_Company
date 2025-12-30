import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'large';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'default',
  className = '', 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'w-full rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    default: 'h-12 px-6',
    large: 'h-14 px-8'
  };
  
  const variantStyles = {
    primary: 'bg-brand-yellow text-brand-black hover:bg-yellow-400 active:scale-[0.98] shadow-md',
    secondary: 'bg-brand-white text-brand-black border-2 border-brand-black hover:bg-gray-50 active:scale-[0.98]',
    ghost: 'bg-transparent text-brand-yellow hover:bg-brand-yellow/10 active:scale-[0.98]'
  };
  
  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
