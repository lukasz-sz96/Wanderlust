import type {ImgHTMLAttributes} from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  size?: AvatarSize;
  fallback?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getBackgroundColor(name: string): string {
  const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-info', 'bg-success'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ src, alt, size = 'md', fallback, className = '', ...props }: AvatarProps) {
  const initials = fallback || getInitials(alt);
  const bgColor = getBackgroundColor(alt);

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`
          rounded-full object-cover
          ring-2 ring-surface ring-offset-1
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      />
    );
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center
        font-semibold text-white
        ring-2 ring-surface ring-offset-1
        ${sizeStyles[size]}
        ${bgColor}
        ${className}
      `}
      role="img"
      aria-label={alt}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
}

export function AvatarGroup({ children, max = 4 }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visible = childArray.slice(0, max);
  const remaining = childArray.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((child, index) => (
        <div key={index} className="relative">
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-border text-sm font-medium text-foreground ring-2 ring-surface">
          +{remaining}
        </div>
      )}
    </div>
  );
}

export default Avatar;
