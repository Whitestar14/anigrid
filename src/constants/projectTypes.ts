import type { ElementType } from "react";
import { Layers, LayoutGrid, List } from "lucide-react";
import type { ProjectType } from "@/types";

export interface ProjectTypeMeta {
  type: ProjectType;
  /** Short noun for chips and list rows. */
  label: string;
  /** One-line description, for places with room for a subtitle. */
  hint: string;
  /** Full name for headings and identity rows. */
  longLabel: string;
  icon: ElementType;
  /** Accent behind the icon. A semantic token, never a palette entry. */
  tint: string;
}

export const PROJECT_TYPES: readonly ProjectTypeMeta[] = [
  {
    type: "ranking",
    label: "Grid",
    hint: "Rank with a board",
    longLabel: "Ranking Grid",
    icon: LayoutGrid,
    tint: "var(--color-accent-blue)",
  },
  {
    type: "list",
    label: "List",
    hint: "Rank in order",
    longLabel: "Ranked List",
    icon: List,
    tint: "var(--color-accent-green)",
  },
  {
    type: "tierlist",
    label: "Tiers",
    hint: "Sort into tiers",
    longLabel: "Tier List",
    icon: Layers,
    tint: "var(--color-accent-purple)",
  },
] as const;

export const projectTypeMeta = (type: ProjectType): ProjectTypeMeta =>
  PROJECT_TYPES.find((t) => t.type === type) ?? PROJECT_TYPES[0];
