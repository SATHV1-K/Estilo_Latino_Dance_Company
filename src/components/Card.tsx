import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  onClick?: () => void;
  variant?: 'light' | 'dark';
}

export function Card({ children, className = '', padding = 'medium', onClick, variant = 'light' }: CardProps) {
  const paddingStyles = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };
  
  const bgColor = variant === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-brand-white';
  
  return (
    <div
      className={`${bgColor} rounded-xl shadow-md ${paddingStyles[padding]} ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-brand-black font-semibold ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
}