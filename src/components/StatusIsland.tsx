import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Check } from "lucide-react";
import { useActivityState } from "@/state/activityState";

export const StatusIsland: React.FC<{
  onCreateProject: () => void;
  /** Disabled when there is no project to copy the schema from. */
  canCreate?: boolean;
}> = ({ onCreateProject, canCreate = true }) => {
  const phase = useActivityState((s) => s.phase);
  const label = useActivityState((s) => s.label);
  const progress = useActivityState((s) => s.progress);
  const seq = useActivityState((s) => s.seq);

  const busy = phase === "busy";
  const isIdle = phase === "idle";

  const description = isIdle ? "New project with this layout" : (label ?? "Working");

  return (
    <motion.button
      type="button"
      onClick={onCreateProject}
      disabled={busy || !canCreate}
      aria-live="polite"
      aria-label={description}
      title={description}
      className={`relative shrink-0 grid place-items-center h-8 w-8 rounded-full material-thin overflow-hidden
                  transition-colors duration-150
                  ${busy ? "cursor-progress" : "hover:brightness-125"}
                  ${isIdle ? "text-muted hover:text-text" : "text-text"}`}
      whileTap={busy ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 520, damping: 30 }}
    >
      {/* Success: a radial gradient blooming from the centre of the control.
          Two offset pulses so it reads as a breath rather than a flash. */}
      {phase === "success" && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(48,209,88,0.85) 0%, rgba(48,209,88,0.45) 34%, rgba(48,209,88,0.12) 58%, rgba(48,209,88,0) 76%)",
              }}
              initial={{ opacity: 0, scale: 0.35 }}
              animate={{ opacity: [0, 1, 0], scale: [0.35, 1, 1.35] }}
              transition={{
                duration: 0.95,
                delay: i * 0.14,
                ease: [0.22, 0.8, 0.3, 1],
                times: [0, 0.4, 1],
              }}
            />
          ))}
          {/* A single, self-lit rim so the shape holds while the bloom fades. */}
          <motion.span
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0] }}
            transition={{ duration: 1.05, ease: "easeOut" }}
            style={{ boxShadow: "inset 0 0 0 1.5px rgba(48,209,88,0.9)" }}
          />
        </span>
      )}

      {/* Cross-fade the glyph so a state change is a transition, not a swap. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={`${phase}-${isIdle ? 0 : seq % 2}`}
          initial={{ opacity: 0, scale: 0.6, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 25 }}
          transition={{ type: "spring", stiffness: 480, damping: 30 }}
          className="relative grid place-items-center"
        >
          {isIdle ? (
            <Plus size={16} strokeWidth={2.6} />
          ) : busy ? (
            <ProgressRing progress={progress} />
          ) : (
            <Check size={16} strokeWidth={3} style={{ color: "#30d158" }} />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
};

/**
 * A ring that is determinate when the task can report progress and an endless
 * sweep when it cannot — the same visual language iOS uses for both cases.
 */
const ProgressRing: React.FC<{ progress?: number }> = ({ progress }) => {
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  const determinate = progress !== undefined;

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className="text-muted"
      aria-hidden
    >
      <circle
        cx="9"
        cy="9"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.22}
        strokeWidth="2"
      />
      {determinate ? (
        <circle
          cx="9"
          cy="9"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 9 9)"
          style={{
            transition: "stroke-dashoffset 220ms cubic-bezier(0.32,0.72,0,1)",
          }}
        />
      ) : (
        <circle
          className="ring-sweep"
          cx="9"
          cy="9"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.28} ${circumference}`}
        />
      )}
    </svg>
  );
};
