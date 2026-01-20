import {   forwardRef } from 'react';
import { motion } from 'framer-motion';
import type {ButtonHTMLAttributes, ReactNode} from 'react';

type IconButtonVariant = 'default' | 'ghost' | 'primary' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label: string;
  children: ReactNode;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'bg-surface border border-border text-foreground hover:bg-border-light active:bg-border',
  ghost: 'bg-transparent text-muted hover:text-foreground hover:bg-border-light active:bg-border',
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover shadow-sm',
  danger: 'bg-transparent text-muted hover:text-error hover:bg-red-50 active:bg-red-100',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'default', size = 'md', label, children, disabled, className = '', onDrag: _onDrag, onDragStart: _onDragStart, onDragEnd: _onDragEnd, onAnimationStart: _onAnimationStart, onAnimationEnd: _onAnimationEnd, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className={`
          inline-flex items-center justify-center
          rounded-lg transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled}
        aria-label={label}
        title={label}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default IconButton;
