import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { PixelText } from "./PixelText";
import { PIXEL_ROWS, pixelTextUnits } from "./pixelFont";

interface PixelInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Accessible name; the bitmap is decorative to a screen reader. */
  label: string;
  /**
   * Rendered height in px. Use a multiple of the 7px bitmap grid so every glyph
   * pixel lands on a whole device pixel.
   */
  height?: number;
  className?: string;
}

export const PixelInput = React.forwardRef<HTMLInputElement, PixelInputProps>(
  function PixelInput(
    { value, onChange, onBlur, onKeyDown, label, height = 14, className = "" },
    forwardedRef,
  ) {
    const ownRef = useRef<HTMLInputElement>(null);
    const [caret, setCaret] = useState(value.length);
    const [focused, setFocused] = useState(false);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        ownRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    /* Clamp when the value shrinks from outside (a preset, an undo) so a stale
       caret cannot point past the string and park itself at the field's edge. */
    useLayoutEffect(() => {
      setCaret((c) => Math.min(c, value.length));
    }, [value.length]);

    const syncCaret = () => {
      const input = ownRef.current;
      if (input && input.selectionStart !== null)
        setCaret(input.selectionStart);
    };

    const caretX =
      (pixelTextUnits(value.slice(0, caret)) / PIXEL_ROWS) * height;

    return (
      <span
        className={`relative flex items-center rounded-chip bg-surface-secondary
                    border border-transparent focus-within:border-border
                    transition-colors duration-150 ${className}`}
        style={{ height: 32 }}
      >
        <span
          aria-hidden
          className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center
                     pointer-events-none overflow-hidden max-w-[calc(100%-20px)]"
          style={{ color: "var(--color-text)" }}
        >
          <PixelText text={value} height={height} />
          {focused && (
            <span
              className="pixel-caret absolute -top-px block w-[2px]"
              style={{
                left: caretX,
                height: height + 2,
                backgroundColor: "var(--color-primary)",
              }}
            />
          )}
        </span>

        <input
          ref={setRefs}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            requestAnimationFrame(syncCaret);
          }}
          onSelect={syncCaret}
          onKeyUp={syncCaret}
          onClick={syncCaret}
          onFocus={() => {
            setFocused(true);
            syncCaret();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          aria-label={label}
          className="absolute inset-0 w-full h-full px-2.5 bg-transparent
                     text-transparent caret-transparent outline-none
                     selection:bg-primary/25"
        />
      </span>
    );
  },
);
