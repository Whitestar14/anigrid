import { useInboxController } from "@/hooks/useInboxController";
import { BottomDockLayout } from "./Inbox/BottomDockLayout";
import type { InboxProps } from "./Inbox/types";

export type { InboxProps };

export function Inbox({ requestConfirm }: InboxProps) {
  return <BottomDockLayout ctrl={useInboxController(requestConfirm)} />;
}
