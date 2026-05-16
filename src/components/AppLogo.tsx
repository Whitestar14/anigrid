import React from 'react';
import { motion } from 'motion/react';


export const LoadingScreen: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-[9999] flex items-center justify-center"
    >
      <div className="relative w-8 h-8">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-[14px] top-0 w-[3px] h-[8px] bg-muted rounded-full origin-[1.5px_16px]"
            style={{ rotate: i * 30 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              delay: i * 0.083,
              ease: "linear"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};
