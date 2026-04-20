import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ControlsProps {
  projectName: string;
  onOpenLibrary: () => void;
  onToggleSidebar: () => void;
  onOpenExport: () => void;
  isSidebarOpen: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ 
  projectName,
  onOpenLibrary,
  onToggleSidebar,
  onOpenExport,
  isSidebarOpen
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 md:px-6 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm transition-all duration-300">
      <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between relative">
        
        {/* Left: Settings Button */}
        <div className="flex items-center shrink-0 w-20">
          <Button 
             variant="ghost"
             size="icon"
             onClick={onToggleSidebar}
             className={`text-muted hover:text-text transition-colors ${isSidebarOpen ? 'bg-white/10 text-white' : ''}`}
             title="Toggle Settings Sidebar"
           >
             <Settings2 size={20} />
          </Button>
        </div>

        {/* Center: Project Name (Clickable) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <button 
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors group"
            title="Open Library"
          >
            <span className="font-semibold text-[15px] text-white tracking-tight truncate max-w-[150px] sm:max-w-[300px] flex items-center justify-center relative min-w-[20px] min-h-[22px]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span 
                  key={projectName} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="inline-block whitespace-nowrap"
                >
                  {projectName || "Untitled"}
                </motion.span>
              </AnimatePresence>
            </span>
            <ChevronDown size={14} className="text-white/50 group-hover:text-white/80 transition-colors shrink-0" />
          </button>
        </div>

        {/* Right: Export Button */}
        <div className="flex items-center justify-end shrink-0 w-20">
           <Button
            variant="secondary"
            onClick={onOpenExport}
            className="gap-2 px-3 md:px-4 bg-white/10 hover:bg-white/20 text-white border-0"
           >
             <Download size={16} strokeWidth={2.5} />
             <span className="hidden md:inline font-medium">Export</span>
           </Button>
        </div>
      </div>
    </header>
  );
};
