import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | React.ReactNode;
  className?: string;
  hideChevron?: boolean;
  dropdownClassName?: string;
  alignOffset?: 'left' | 'right';
  customTrigger?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ options, value, onChange, placeholder, className, hideChevron, dropdownClassName, alignOffset = 'left', customTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {customTrigger ? (
         <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer flex justify-center items-center">
             {customTrigger}
         </div>
      ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center justify-between w-full h-10 px-3.5 text-subheadline text-left",
              "material-thin squircle rounded-control text-text",
              "transition-colors duration-150 focus-visible:focus-ring hover:brightness-110"
            )}
          >
            <span className={cn("block truncate", !selectedOption && "text-muted")}>
              {selectedOption ? selectedOption.label : placeholder || 'Select...'}
            </span>
            {!hideChevron && (
                <ChevronDown className={cn("w-4 h-4 text-muted transition-transform duration-200", isOpen && "rotate-180")} />
            )}
          </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.65 }}
            className={cn(
              "absolute z-50 mt-1.5 overflow-hidden p-1",
              "material squircle rounded-card scrollbar-ios",
              dropdownClassName || "w-full min-w-[140px]",
              alignOffset === "right" ? "right-0" : "left-0"
            )}>
            <ul role="listbox" className="max-h-60 overflow-auto flex flex-col">
              {options.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-chip text-subheadline",
                    "text-text transition-colors cursor-pointer active:bg-hover",
                    value === option.value && "bg-surface-secondary font-medium"
                  )}
                >
                  <span className="block truncate">{option.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
