import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive';
type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-md px-3 text-xs',
  default: 'h-10 rounded-md px-4 py-2',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
