import React from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, icon, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--color-primary),0.3)] border border-primary/50',
      secondary: 'bg-surface-elevated hover:bg-hover text-text border border-border shadow-sm',
      ghost: 'hover:bg-hover text-muted hover:text-text',
      outline: 'border border-border hover:bg-hover text-text',
      danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10 flex items-center justify-center p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className={cn(children ? "mr-2" : "")}>{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
