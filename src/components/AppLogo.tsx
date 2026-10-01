import React from "react";
import { motion } from "motion/react";

export const LoadingScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-[9999] flex items-center justify-center"
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 32 32"
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <motion.rect
            key={i}
            x="14.5"
            y="2.5"
            width="3"
            height="7"
            rx="1.5"
            fill="var(--color-muted)"
            transform={`rotate(${i * 30} 16 16)`}
            initial={{ opacity: 0.18 }}
            animate={{ opacity: [0.18, 1, 0.18] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: i * 0.083,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </motion.div>
  );
};
