import React, { useId } from "react";
import { motion } from "framer-motion";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = ""
}: SegmentedControlProps<T>) {
  const layoutId = useId();

  return (
    <div className={`flex items-center bg-surface-secondary rounded-full p-0.5 relative ${className}`}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(option.value);
            }}
            className={`
              relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors z-10 flex-1
              ${isActive ? "text-text" : "text-muted hover:text-text"}
            `}
          >
            {isActive && (
              <motion.div
                layoutId={`segmented-indicator-${layoutId}`}
                className="absolute inset-0 bg-surface-elevated shadow-sm rounded-full -z-10 border border-border"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            {option.icon && <span className="shrink-0 flex items-center">{option.icon}</span>}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
