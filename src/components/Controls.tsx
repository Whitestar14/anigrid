import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings2, X, Download, ChevronDown } from "lucide-react";
import { StatusIsland } from "@/components/StatusIsland";
import { useActivityState } from "@/state/activityState";

interface ControlsProps {
  projectName: string;
  onOpenLibrary: () => void;
  onToggleSidebar: () => void;
  onOpenExport: () => void;
  isSidebarOpen: boolean;
  onCreateProject: () => void;
  /** True once the board has scrolled under the bar. */
  isScrolled?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  projectName,
  onOpenLibrary,
  onToggleSidebar,
  onOpenExport,
  isSidebarOpen,
  onCreateProject,
  isScrolled = false,
}) => {
  const phase = useActivityState((s) => s.phase);
  const activityLabel = useActivityState((s) => s.label);
  const seq = useActivityState((s) => s.seq);

  const statusText = phase === "idle" ? null : (activityLabel ?? "Working");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-chrome h-14 material-chrome
                  transition-shadow duration-300 ease-standard ${
                    isScrolled ? "shadow-[0_1px_0_0_var(--material-hairline)]" : ""
                  }`}
    >
      <div className="h-full w-full max-w-[1920px] mx-auto px-2 md:px-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Left: settings rail.

            The trigger becomes a cross while the rail is open, so the rail
            itself needs no close button. Four separate ways to close one panel
            — the toolbar, a rail header cross, a second cross inside the
            project card, and the scrim — was three too many, and the two
            unlabelled crosses in particular were indistinguishable from each
            other. One control, two states. */}
        <div className="flex items-center justify-start min-w-0">
          <motion.button
            type="button"
            onClick={onToggleSidebar}
            aria-pressed={isSidebarOpen}
            aria-label={isSidebarOpen ? "Close settings" : "Open settings"}
            title={isSidebarOpen ? "Close settings" : "Open settings"}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 520, damping: 30 }}
            className={`grid place-items-center w-9 h-9 rounded-full transition-colors duration-150 ${
              isSidebarOpen ? "bg-hover text-text" : "text-muted hover:text-text hover:bg-hover"
            }`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={isSidebarOpen ? "close" : "open"}
                initial={{ opacity: 0, scale: 0.5, rotate: isSidebarOpen ? -80 : 80 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: isSidebarOpen ? 80 : -80 }}
                transition={{ type: "spring", stiffness: 520, damping: 30 }}
                className="grid place-items-center"
              >
                {isSidebarOpen ? (
                  <X size={18} strokeWidth={2.4} />
                ) : (
                  <Settings2 size={18} strokeWidth={2} />
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Centre: the project selector, which also carries status. */}
        <div className="flex items-center gap-2 min-w-0">
          <motion.button
            onClick={onOpenLibrary}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            layout
            transition={{
              layout: { type: "spring", stiffness: 500, damping: 34, mass: 0.6 },
              type: "spring",
              stiffness: 480,
              damping: 30,
              mass: 0.6,
            }}
            aria-live="polite"
            className="flex items-center gap-1.5 px-3 h-9 min-w-0 rounded-full material-thin
                       hover:bg-hover transition-colors duration-150"
            title={statusText ? statusText : "Switch project"}
          >
            {/* One line, clipped. The name and the status are two states of the
                same slot, so the pill's width never changes as activity starts
                and stops — the text slides through a fixed window instead. */}
            <span className="relative block h-5 leading-5 min-w-[1ch] max-w-[40vw] sm:max-w-[300px] overflow-hidden text-left">
              <AnimatePresence mode="popLayout" initial={false}>
                {statusText ? (
                  <motion.span
                    key={`status-${seq}`}
                    initial={{ y: "120%", opacity: 0.4 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-120%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 38 }}
                    className="block truncate whitespace-nowrap font-medium text-subheadline text-primary"
                  >
                    {statusText}
                  </motion.span>
                ) : (
                  <motion.span
                    key={`name-${projectName}`}
                    initial={{ y: "120%", opacity: 0.4 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-120%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 36 }}
                    className="block truncate whitespace-nowrap font-semibold text-subheadline text-text tracking-tight"
                  >
                    {projectName || "Untitled"}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <ChevronDown size={14} className="text-muted shrink-0" />
          </motion.button>

          <StatusIsland onCreateProject={onCreateProject} />
        </div>

        {/* Right: export. Springs on press like every other control in the bar;
            as a plain `Button` it was the one thing up here that did not react
            to the pointer at all. */}
        <div className="flex items-center justify-end min-w-0">
          <motion.button
            type="button"
            onClick={onOpenExport}
            aria-label="Export project"
            title="Export project"
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 520, damping: 30, mass: 0.6 }}
            className="inline-flex items-center justify-center gap-2 h-9 px-2.5 md:px-3.5
                       rounded-full text-muted hover:text-text hover:bg-hover
                       transition-colors duration-150 outline-none focus-visible:focus-ring"
          >
            <Download size={18} strokeWidth={2} />
            <span className="hidden md:inline font-medium text-subheadline">Export</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
