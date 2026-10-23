import React, { useEffect, useState } from "react";
import { brandColorAt } from "@/constants/brand";

const PATH = [0, 1, 2, 5, 8, 7, 6, 3, 4, 5, 2, 1];
const STEP_MS = 130;

export const PixelSpinner: React.FC<{
  cell?: number;
  className?: string;
  label?: string;
}> = ({ cell = 4, className = "", label = "Loading" }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setStep((s) => (s + 1) % PATH.length),
      STEP_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  const litCell = PATH[step];

  return (
    <span
      role="status"
      aria-label={label}
      className={`grid grid-cols-3 place-items-center ${className}`}
      style={{ gap: Math.max(1, Math.round(cell / 2)), width: "max-content" }}
    >
      {Array.from({ length: 9 }, (_, index) => {
        const lit = index === litCell;
        return (
          <span
            key={index}
            aria-hidden
            className="block"
            style={{
              width: cell,
              height: cell,
              backgroundColor: lit
                ? brandColorAt(step % 9)
                : "color-mix(in srgb, var(--color-text) 12%, transparent)",
              transition: "background-color 0ms", // hard cut, no fade
            }}
          />
        );
      })}
    </span>
  );
};
