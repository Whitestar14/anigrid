import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, className }) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newVal);
    }, 50); // Fast debounce for smooth feel
  };

  return (
    <input
      type="color"
      value={localValue}
      onChange={handleChange}
      className={cn("opacity-0 absolute inset-0 w-full h-full cursor-pointer", className)}
    />
  );
};
