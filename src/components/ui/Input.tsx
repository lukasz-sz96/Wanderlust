import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{leftIcon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-lg border bg-surface px-4 py-2.5
              text-foreground placeholder:text-muted-light
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-border-light
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-error focus:ring-error' : 'border-border hover:border-muted'}
              ${className}
            `}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{rightIcon}</div>}
        </div>
        {(error || hint) && <p className={`mt-1.5 text-sm ${error ? 'text-error' : 'text-muted'}`}>{error || hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
