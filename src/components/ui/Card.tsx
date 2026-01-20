import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type CardVariant = 'default' | 'elevated' | 'outline';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface border border-border-light shadow-sm',
  elevated: 'bg-surface-elevated shadow-lg border-0',
  outline: 'bg-transparent border-2 border-border',
};

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hoverable = false, children, className = '', ...props }, ref) => {
    const baseStyles = `
      rounded-xl overflow-hidden
      ${variantStyles[variant]}
      ${paddingStyles[padding]}
      ${hoverable ? 'transition-shadow duration-200 hover:shadow-lg cursor-pointer' : ''}
      ${className}
    `;

    if (hoverable) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={baseStyles}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseStyles} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 ${className}`} {...props}>
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = '', ...props }, ref) => (
    <h3 ref={ref} className={`text-lg font-semibold text-foreground ${className}`} {...props}>
      {children}
    </h3>
  ),
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className = '', ...props }, ref) => (
    <p ref={ref} className={`text-sm text-muted ${className}`} {...props}>
      {children}
    </p>
  ),
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`${className}`} {...props}>
      {children}
    </div>
  ),
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`flex items-center pt-4 ${className}`} {...props}>
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

export default Card;
