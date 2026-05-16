import React from 'react';
import { cn } from '@/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-muted pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-2xl bg-surface-secondary border border-border px-3 py-2 text-sm text-text placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-surface-elevated',
            'backdrop-blur-md transition-all duration-200',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
