
export interface GridConfig {
  rows: number;
  cols: number;
}

export interface CellData {
  id: string; 
  imageSrc: string | null;
  position: number;
  // Extended data for List View
  textLabel?: string;
  rating?: number; // 0-10
  // Visuals
  alignment?: 'top' | 'center' | 'bottom';
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

export type GridStyle = 'seamless' | 'card';
export type RankMode = 'grid' | 'list' | 'tier';
export type ProjectType = 'ranking' | 'tierlist';

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
  type: ProjectType; // New strict separation
  mode: RankMode; 
  config: GridConfig; // Used for Grid Mode
  cells: CellData[]; // Used for Grid/List Mode
  style: GridStyle;
  
  // Visual Preferences
  showNumbers: boolean;
  showTitle: boolean;
  showDate: boolean;
  showTiers?: boolean;
  borderless?: boolean; // New: Toggle item borders in grid
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  gap: number; 
  backgroundColor: string; 

  tiers?: TierData[];
  
  // Tier List Data (Dedicated)
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
  };
}

export type DragSource = 
  | { type: 'cell'; index: number }
  | { type: 'inbox'; id: string; originCollectionId: string }
  | { type: 'search'; imageSrc: string };

export interface JikanResult {
  mal_id: number;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    }
  };
  title?: string;
  name?: string;
}

// Interaction State
export type InteractionState = 
  | { type: 'cell'; index: number } // For Grid/List
  | { type: 'tier-item'; rowId: string; itemId: string } // For Tier List
  | { type: 'inbox'; itemId: string; collectionId: string }
  | null;
