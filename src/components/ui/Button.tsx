import React from "react";
import { cn } from "@/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "tinted" | "plain" | "gray" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "filled",
      size = "md",
      isLoading,
      children,
      disabled,
      icon,
      fullWidth,
      ...props
    },
    ref
  ) => {
    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      filled: "bg-primary text-on-accent hover:brightness-110",
      tinted: "bg-primary/15 text-primary hover:bg-primary/20",
      plain: "text-primary hover:opacity-70",
      gray: "bg-surface-secondary text-text hover:bg-hover",
      danger: "bg-destructive/15 text-destructive hover:bg-destructive/20",
    };

    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-8 px-3.5 text-footnote",
      md: "h-10 px-4 text-subheadline",
      lg: "h-12 px-6 text-body",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold",
          // iOS dims on press rather than shrinking the control.
          "transition-[background-color,opacity,filter] duration-150",
          "outline-none focus-visible:focus-ring",
          "active:opacity-65 disabled:opacity-40 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon && <span className="shrink-0 flex items-center">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
