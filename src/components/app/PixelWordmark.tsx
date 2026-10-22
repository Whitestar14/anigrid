import React from "react";

/**
 * A 5×7 pixel wordmark, drawn from a bitmap rather than set in a typeface.
 *
 * The board's signature line used to be the word "Ranku" in Inter with wide
 * tracking — the same thing every app does. A bitmap gives the footer its own
 * voice, and it survives export byte-for-byte because it is a path, not text
 * that a rasteriser might hint differently on another machine.
 *
 * The whole alphabet is here, not just the five letters currently in use. The
 * name is still under discussion, and re-cutting a font every time it changes
 * would be the wrong kind of work.
 */
const GLYPHS: Record<string, readonly string[]> = {
  " ": ["     ", "     ", "     ", "     ", "     ", "     ", "     "],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["...##", "....#", "....#", "....#", "#...#", "#...#", ".###."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
};

const GLYPH_W = 5;
const GLYPH_H = 7;
/** One empty column between letters. */
const TRACKING = 1;

/**
 * Each glyph's horizontal runs are merged into one rectangle apiece, so the
 * entire word is a single `<path>` instead of a few hundred `<rect>`s. Fewer
 * nodes matters because this sits inside the node tree `html-to-image` walks on
 * every export.
 */
const buildPath = (word: string): string =>
  word
    .split("")
    .map((char, letter) => {
      const glyph = GLYPHS[char];
      if (!glyph) return "";

      const originX = letter * (GLYPH_W + TRACKING);
      return glyph
        .map((row, y) => {
          let runs = "";
          for (let x = 0; x < row.length; x++) {
            if (row[x] !== "#") continue;

            let run = 1;
            while (row[x + run] === "#") run++;

            runs += `M${originX + x} ${y}h${run}v1h-${run}z`;
            x += run - 1;
          }
          return runs;
        })
        .join("");
    })
    .join("");

/** Width of a word in bitmap units, for the svg's viewBox and aspect ratio. */
const unitsWide = (word: string) =>
  word.length * GLYPH_W + Math.max(0, word.length - 1) * TRACKING;

export const PixelWordmark: React.FC<{
  /** Defaults to the app's working name. */
  word?: string;
  /**
   * Rendered height in px. Prefer a whole multiple of the 7px grid (7, 14, 21)
   * so every pixel lands on a whole device pixel and none of them look fatter
   * than their neighbours.
   */
  height?: number;
  className?: string;
}> = ({ word = "RANKU", height = 14, className }) => {
  const upper = word.toUpperCase();
  const path = buildPath(upper);
  const units = unitsWide(upper);

  return (
    <svg
      viewBox={`0 0 ${units} ${GLYPH_H}`}
      width={(units / GLYPH_H) * height}
      height={height}
      role="img"
      aria-label={upper}
      fill="currentColor"
      /* Pixel art has no antialiasing budget: the browser must not smooth the
         steps between runs, which is the entire point of the effect. */
      shapeRendering="crispEdges"
      className={className}
    >
      <path d={path} />
    </svg>
  );
};
