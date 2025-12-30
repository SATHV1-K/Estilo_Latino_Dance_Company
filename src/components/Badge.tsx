import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'default' | 'best-value';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    success: 'bg-success text-brand-white',
    error: 'bg-error text-brand-white',
    warning: 'bg-warning text-brand-black',
    default: 'bg-gray-300 text-gray-700',
    'best-value': 'bg-brand-yellow text-brand-black font-semibold'
  };
  
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: 'active' | 'expired' | 'inactive';
  label?: string;
  className?: string;
}

export function StatusDot({ status, label, className = '' }: StatusDotProps) {
  const statusColors = {
    active: 'bg-success',
    expired: 'bg-error',
    inactive: 'bg-gray-400'
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
