import React from "react";
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
  const activeIndex = options.findIndex((opt) => opt.value === value);

  return (
    <div className={`flex items-center bg-surface-secondary rounded-full p-0.5 relative ${className}`}>
      <motion.div
        className="absolute inset-y-0.5 left-0 pointer-events-none z-0"
        style={{ width: `${100 / options.length}%` }}
        animate={{ x: `${activeIndex * 100}%` }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        initial={false}
      >
        <div className="w-full h-full px-0.5">
          <div className="w-full h-full bg-surface-elevated shadow-sm rounded-full border border-border" />
        </div>
      </motion.div>

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
            {option.icon && <span className="shrink-0 flex items-center">{option.icon}</span>}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
