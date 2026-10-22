import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { PixelText } from "@/components/pixel/PixelText";
import { brandColorAt } from "@/constants/brand";

const WORD = "RANKU";
const LETTER_HEIGHT = 21;

export const LoadingScreen: React.FC = () => {
  const reducedMotion = useReducedMotion();
  const reduce = reducedMotion ?? false;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-[9999] grid place-items-center overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-conic-gradient(var(--color-text) 0% 25%, transparent 0% 50%)",
          backgroundSize: "6px 6px",
          maskImage:
            "radial-gradient(ellipse at center, transparent 22%, #000 92%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, transparent 22%, #000 92%)",
        }}
      />

      <div
        role="status"
        aria-label="Loading"
        className="relative flex flex-col items-center gap-6"
      >
        <div className="flex items-end" style={{ gap: 3 }}>
          {[...WORD].map((letter, i) => (
            <span key={`${letter}-${i}`} style={{ color: brandColorAt(i) }}>
              <PixelText text={letter} height={LETTER_HEIGHT} />
            </span>
          ))}
        </div>

        <div
          className="loader-track"
          aria-hidden
          data-reduce={reduce || undefined}
        >
          <div className="loader-progress">
            <div className="loader-ramp" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
