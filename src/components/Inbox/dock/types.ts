import type { useInboxController } from "@/hooks/useInboxController";

/** The full surface of the dock's controller, threaded down to each panel. */
export type DockCtrl = ReturnType<typeof useInboxController>;
