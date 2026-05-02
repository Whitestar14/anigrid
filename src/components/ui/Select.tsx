import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
              "flex items-center justify-between w-full h-10 px-4 py-2 text-sm text-left bg-black/20 border border-white/10 rounded-full",
              "hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
              "backdrop-blur-md transition-all duration-200 text-white"
            )}
          >
            <span className={cn("block truncate", !selectedOption && "text-white/30")}>
              {selectedOption ? selectedOption.label : placeholder || 'Select...'}
            </span>
            {!hideChevron && (
                <ChevronDown className={cn("w-4 h-4 text-white/50 transition-transform duration-200", isOpen && "rotate-180")} />
            )}
          </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn("absolute z-50 mt-2 overflow-hidden bg-[#2c2c2e]/95 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl",
              dropdownClassName || "w-full min-w-[140px]",
              alignOffset === 'right' ? "right-0" : "left-0"
          )}>
            <ul className="max-h-60 overflow-auto flex flex-col">
              {options.map((option, idx) => (
                <React.Fragment key={option.value}>
                  <li
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center p-3 hover:bg-white/10 rounded-xl text-[13px] font-medium text-white transition-colors cursor-pointer",
                      value === option.value && "bg-white/5"
                    )}
                  >
                    <span className="block truncate">{option.label}</span>
                  </li>
                  {idx < options.length - 1 && <div className="h-px bg-white/10 mx-2 my-0.5 shrink-0" />}
                </React.Fragment>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
