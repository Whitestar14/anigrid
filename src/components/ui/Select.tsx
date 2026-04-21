import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils';
import { ChevronDown } from 'lucide-react';

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
         <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
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

      {isOpen && (
        <div className={cn("absolute z-50 mt-2 overflow-hidden bg-[#18181b]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200",
            dropdownClassName || "w-full",
            alignOffset === 'right' ? "right-0" : "left-0"
        )}>
          <ul className="max-h-60 overflow-auto py-1">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "relative cursor-pointer select-none py-2 pl-3 pr-9 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors",
                  value === option.value && "bg-primary/20 text-primary font-medium hover:bg-primary/30"
                )}
              >
                <span className="block truncate">{option.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
