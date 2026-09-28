import React from 'react';
import { Loader2, AlertCircle, Inbox, HelpCircle } from 'lucide-react';

// Brand Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#0F294A] text-white hover:bg-[#16365D] focus:ring-[#0F294A]',
    secondary: 'bg-[#059669] text-white hover:bg-[#047857] focus:ring-[#059669]',
    outline: 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-300',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

// Brand Badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'navy' | 'green' | 'amber' | 'slate' | 'red';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    navy: 'bg-[#0F294A]/10 text-[#0F294A] border border-[#0F294A]/20',
    green: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-md ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Form Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F294A] transition-colors ${
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});
Input.displayName = 'Input';

// Content Required / Placeholder Notice
export const ContentRequiredBadge: React.FC<{ text?: string }> = ({ text = '[CONTENT REQUIRED]' }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-300">
    <HelpCircle className="w-3 h-3" />
    {text}
  </span>
);

// Loading State
export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading diagnostic data...' }) => (
  <div className="py-16 text-center space-y-3">
    <Loader2 className="w-8 h-8 text-[#0F294A] animate-spin mx-auto" />
    <p className="text-sm font-medium text-slate-600">{message}</p>
  </div>
);

// Empty State
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => (
  <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-3">
    <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
    <h4 className="text-sm font-bold text-slate-800">{title}</h4>
    {description && <p className="text-xs text-slate-500 max-w-sm mx-auto">{description}</p>}
    {actionText && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionText}
      </Button>
    )}
  </div>
);

// Error Alert State
export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3 text-red-800 text-xs">
    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
    <div className="flex-1 space-y-1">
      <p className="font-semibold">Unable to load information</p>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-bold underline mt-1 block">
          Try Again
        </button>
      )}
    </div>
  </div>
);
