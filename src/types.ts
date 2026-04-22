export interface GridConfig {
  rows: number;
  cols: number;
}

export interface CellData {
  id: string;
  imageSrc: string | null;
  position: number;
  textLabel?: string;
  rating?: number;
  alignment?: "top" | "center" | "bottom";
  objectPosition?: string;
  zoom?: number;
}

export interface InboxItem {
  id: string;
  imageSrc: string;
  createdAt: number;
}

export interface InboxCollection {
  id: string;
  name: string;
  items: InboxItem[];
}

export type GridStyle = "seamless" | "card";
export type RankMode = "grid" | "list" | "tier";
export type ProjectType = "ranking" | "tierlist";

export interface TierRow {
  id: string;
  label: string;
  color: string;
  items: CellData[];
}

export interface TierData {
  label: string;
  color: string;
}

export interface Rank {
  id: string;
  title: string;
  type: ProjectType;
  mode: RankMode;
  config: GridConfig;
  cells: CellData[];
  style: GridStyle;

  showNumbers: boolean;
  showTitle: boolean;
  showDate: boolean;
  showTiers?: boolean;
  borderless?: boolean;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "16:9" | "9:16";
  cellWidth?: number;
  gap: number;
  backgroundColor: string;

  tiers?: TierData[];

  tierRows: TierRow[];

  createdAt: number;
  updatedAt: number;
}

export interface GlobalTheme {
  accentColor: string;
  paletteId: string;
  isDark: boolean;
}

export interface GlobalState {
  version: number;
  activeRankId: string;
  theme?: GlobalTheme;
  ranks: Record<string, Rank>;
  inbox: {
    collections: InboxCollection[];
    activeCollectionId: string;
    lastTargetCollectionId?: string;
  };
  preferences: {
    skipDuplicateWarning: boolean;
    /** Disables backdrop-blur across the app (better on low-end GPUs). */
    reduceGlassEffects: boolean;
    /** When true, dock collapses on drag start on desktop too (not only mobile). */
    autoCloseDockOnDragDesktop: boolean;
  };
}

export type DragSource =
  | { type: "cell"; index: number }
  | { type: "inbox"; id: string; originCollectionId: string }
  | { type: "search"; imageSrc: string };

export interface JikanResult {
  mal_id: number;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  title?: string;
  name?: string;
}

// Interaction State
export type InteractionState =
  | { type: "cell"; index: number }
  | { type: "tier-item"; rowId: string; itemId: string }
  | { type: "inbox"; itemId: string; collectionId: string }
  | { type: "inbox-multi"; itemIds: string[]; collectionId: string }
  | { type: "search"; imageSrc: string }
  | null;
