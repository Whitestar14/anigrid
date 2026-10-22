import React from "react";

/**
 * The pixel icon set.
 */
const ICONS = {
  upload: [
    "....#....",
    "...###...",
    "..#.#.#..",
    "....#....",
    "....#....",
    ".........",
    "#.......#",
    "#.......#",
    "#########",
  ],
  image: [
    "#########",
    "#.......#",
    "#.....#.#",
    "#....###.",
    "#...#####",
    "#..#..#.#",
    "#.#####.#",
    "#.......#",
    "#########",
  ],
  library: [
    ".........",
    "###.####.",
    "#.#.#..#.",
    "#.#.#..#.",
    "#.#.#..#.",
    "#.#.#..#.",
    "#.#.#..#.",
    "###.####.",
    ".........",
  ],
  settings: [
    "..#...#..",
    "..#...#..",
    "#########",
    "##.....##",
    "#...#...#",
    "##.....##",
    "#########",
    "..#...#..",
    "..#...#..",
  ],
  search: [
    ".#####...",
    "#.....#..",
    "#.....#..",
    "#.....#..",
    ".#####...",
    "....##...",
    ".....##..",
    "......##.",
    ".........",
  ],
  plus: [
    ".........",
    "....#....",
    "....#....",
    "....#....",
    "#########",
    "....#....",
    "....#....",
    "....#....",
    ".........",
  ],
  /** The three project types. They are the app's top-level nouns, so they get
   *  the same hand-cut treatment as the furniture around them. */
  grid: [
    "####.####",
    "####.####",
    "####.####",
    "####.####",
    ".........",
    "####.####",
    "####.####",
    "####.####",
    "####.####",
  ],
  list: [
    "#..#####.",
    "#..#####.",
    ".........",
    "#..#####.",
    "#..#####.",
    ".........",
    "#..#####.",
    "#..#####.",
    ".........",
  ],
  /** An image frame with a stroke through it: the universal "no preview". */
  broken: [
    ".........",
    "#########",
    "#......##",
    "#.....#.#",
    "#....#..#",
    "#...#...#",
    "#..#....#",
    "#########",
    ".........",
  ],
  tiers: [
    "##..###..",
    "##..###..",
    "##..###..",
    "#########",
    "##..###..",
    "##..###..",
    "#########",
    "##..###..",
    "##..###..",
  ],
} as const;

export type PixelIconName = keyof typeof ICONS;
const ICON_CELLS = 9;

const iconPath = (rows: readonly string[]) => {
  let d = "";
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== "#") continue;
      let run = 1;
      while (row[x + run] === "#") run++;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run - 1;
    }
  });
  return d;
};

interface PixelIconProps {
  name: PixelIconName;
  /** Rendered edge length in px; a multiple of 9 keeps every pixel square. */
  size?: number;
  className?: string;
  /** Accessible name. Omit when the icon sits next to a visible label. */
  label?: string;
}

/**
 * An icon registry entry as a ready-made component.
 *
 * Data tables like `PROJECT_TYPES` store components, not render calls, and they
 * pass size/className through — this adapter lets a pixel icon slot into those
 * tables without a bespoke wrapper per icon.
 */
export const pixelIcon = (
  name: PixelIconName,
): React.FC<{ size?: number; className?: string; strokeWidth?: number }> =>
  function PixelGlyph({ size, className, strokeWidth: _ignored }) {
    return <PixelIcon name={name} size={size} className={className} />;
  };

export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 18,
  className,
  label,
}) => (
  <svg
    viewBox={`0 0 ${ICON_CELLS} ${ICON_CELLS}`}
    width={size}
    height={size}
    role={label ? "img" : "presentation"}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    fill="currentColor"
    shapeRendering="crispEdges"
    className={className}
  >
    <path d={iconPath(ICONS[name])} />
  </svg>
);
