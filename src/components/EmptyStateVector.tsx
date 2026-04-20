import React from 'react';
import { motion } from 'framer-motion';

export const CuteSlime = ({ className }: { className?: string }) => (
  <motion.svg 
    viewBox="0 0 100 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    animate={{ 
        y: [0, -5, 0],
        scale: [1, 1.02, 1] 
    }}
    transition={{ 
        duration: 2.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
    }}
  >
    <path d="M50 10C30 10 10 30 10 60C10 80 20 90 50 90C80 90 90 80 90 60C90 30 70 10 50 10Z" fill="currentColor" opacity="0.3" />
    <path d="M35 55C35 55 40 60 50 60C60 60 65 55 65 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="35" cy="45" r="4" fill="currentColor" />
    <circle cx="65" cy="45" r="4" fill="currentColor" />
  </motion.svg>
);
