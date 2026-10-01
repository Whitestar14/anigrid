import React from "react";
import { cn } from "@/utils";

export interface ToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, checked, onCheckedChange, disabled, ..._props }, _ref) => (
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
        "relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full",
        "transition-colors duration-200 ease-standard outline-none focus-visible:focus-ring",
        checked ? "bg-accent-green" : "bg-surface-secondary",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={cn(
          "pointer-events-none block h-[27px] w-[27px] rounded-full bg-white",
          "shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]",
          "transition-transform duration-200 ease-standard",
          checked ? "translate-x-[22px]" : "translate-x-[2px]"
        )}
      />
    </button>
  )
);
Toggle.displayName = "Toggle";
