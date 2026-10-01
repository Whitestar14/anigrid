import { create } from "zustand";


export type ActivityPhase = "idle" | "busy" | "success" | "error";

/** How long the success state stays on screen before returning to idle. */
export const SUCCESS_DWELL = 1400;

interface ActivityState {
  phase: ActivityPhase;
  /** Human-readable description of the running task, shown beside the button. */
  label?: string;
  /** 0–1 when the task can report progress, otherwise undefined. */
  progress?: number;
  busyCount: number;
  /** Increments on every phase change so consumers can key animations off it. */
  seq: number;
}

interface ActivityActions {
  begin: (label: string) => number;
  setProgress: (progress?: number) => void;
  settle: (run: number, phase: "success" | "error", label?: string) => void;
  reset: () => void;
}

const idle = (): ActivityState => ({
  phase: "idle",
  label: undefined,
  progress: undefined,
  busyCount: 0,
  seq: 0,
});

let nextRun = 1;
/** Runs still in flight, so a stale settle cannot clear a newer task. */
const liveRuns = new Set<number>();
/** Pending return-to-idle timer, kept outside state so it causes no renders. */
let dwellTimer: number | undefined;

const clearDwell = () => {
  if (dwellTimer !== undefined) {
    window.clearTimeout(dwellTimer);
    dwellTimer = undefined;
  }
};

export const useActivityState = create<ActivityState & ActivityActions>(
  (set, get) => ({
    ...idle(),

    begin: (label) => {
      clearDwell();
      const run = nextRun++;
      liveRuns.add(run);
      set((s) => ({
        phase: "busy",
        label,
        progress: undefined,
        busyCount: s.busyCount + 1,
        seq: s.seq + 1,
      }));
      return run;
    },

    setProgress: (progress) => {
      const clamped =
        progress === undefined ? undefined : Math.max(0, Math.min(1, progress));
      set((s) =>
        s.phase === "busy" ? { progress: clamped, seq: s.seq + 1 } : s
      );
    },

    settle: (run, phase, label) => {
      // Ignore a settle for a run that already reported, or one from a previous
      // session of the island.
      if (!liveRuns.delete(run)) return;

      const remaining = Math.max(0, get().busyCount - 1);
      if (remaining > 0) {
        set({ busyCount: remaining });
        return;
      }

      clearDwell();

      // Failures belong to the toast layer. Call sites already report the
      // message there, so the island does not also have to display it — it just
      // returns to rest. Two places saying "that did not work" is noise.
      if (phase === "error") {
        set((s) => ({ ...idle(), seq: s.seq + 1 }));
        return;
      }

      set((s) => ({
        phase,
        label,
        progress: undefined,
        busyCount: 0,
        seq: s.seq + 1,
      }));

      dwellTimer = window.setTimeout(
        () => set((s) => ({ ...idle(), seq: s.seq + 1 })),
        SUCCESS_DWELL
      );
    },

    reset: () => {
      clearDwell();
      liveRuns.clear();
      set((s) => ({ ...idle(), seq: s.seq + 1 }));
    },
  })
);

export const runActivity = async <T>(
  label: string,
  task: () => Promise<T>,
  options: { successLabel?: string; errorLabel?: string } = {}
): Promise<T | undefined> => {
  const { begin, settle } = useActivityState.getState();
  const run = begin(label);
  try {
    const result = await task();
    settle(run, "success", options.successLabel ?? label);
    return result;
  } catch {
    settle(run, "error", options.errorLabel ?? "Something went wrong");
    return undefined;
  }
};
