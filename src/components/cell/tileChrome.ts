const HAIRLINE = "var(--material-hairline)";

/**
 * Seamless tiles have square corners so a ranked board reads as a single
 * collage; card tiles are individually rounded.
 */
export const tileRadius = (isSeamless: boolean, borderRadius?: number) =>
  isSeamless ? 0 : borderRadius ?? 16;

/**
 * The rule around a tile at rest. With a gap, every tile is its own object and
 * gets a full rule; seamless tiles share edges, so only the outer ones draw.
 */
export const restingTileShadow = ({
  borderless,
  gap,
  index,
  cols,
  count,
}: {
  borderless: boolean;
  gap: number;
  index: number;
  cols: number;
  count: number;
}): string | undefined => {
  if (borderless) return undefined;
  if (gap > 0) return `0 0 0 0.5px ${HAIRLINE}`;
  return [
    `0 -0.5px 0 0 ${HAIRLINE}`,
    `-0.5px 0 0 0 ${HAIRLINE}`,
    index % cols === cols - 1 ? `0.5px 0 0 0 ${HAIRLINE}` : null,
    index + cols >= count ? `0 0.5px 0 0 ${HAIRLINE}` : null,
  ]
    .filter(Boolean)
    .join(", ");
};
