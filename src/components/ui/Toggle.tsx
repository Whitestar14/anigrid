import React from 'react';
import { cn } from '@/utils';
import { motion } from 'motion/react';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, checked, onCheckedChange, disabled, ..._props }, _ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onCheckedChange(!checked);
        }}
        className={cn(
          'relative inline-flex h-[24px] w-[42px] p-[2px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out outline outline-1 outline-border focus:outline-none focus-visible:focus-ring',
          checked ? 'bg-[#34C759] outline-transparent' : 'bg-surface-secondary',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <span className="sr-only">Toggle</span>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            'pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-surface-elevated shadow-sm outline outline-1 outline-black/5 dark:outline-white/5 ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          )}
        />
      </button>
    );
  }
);
Toggle.displayName = 'Toggle';
