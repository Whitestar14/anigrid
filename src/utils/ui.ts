
const RATIO_VALUE: Record<string, number> = {
  "1:1": 1,
  "3:4": 3 / 4,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
};

export const DEFAULT_ASPECT = "3:4";

/** CSS `aspect-ratio` value, e.g. "3 / 4". */
export const aspectToCss = (ratio?: string): string => {
  const [w, h] = (ratio || DEFAULT_ASPECT).split(":");
  const width = Number(w);
  const height = Number(h);
  return `${width > 0 ? width : 3} / ${height > 0 ? height : 4}`;
};

/**
 * The width a tile of `ratio` needs to stand `height` tall. Lets the tier rail
 * and list thumbnails align to a shared baseline height while still honouring
 * the user's chosen aspect ratio.
 */
export const widthForHeight = (ratio: string | undefined, height: number) => {
  const value = RATIO_VALUE[ratio || DEFAULT_ASPECT] ?? RATIO_VALUE[DEFAULT_ASPECT];
  return Math.round(height * value);
};
