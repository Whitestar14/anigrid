export const BRAND_PALETTE = [
  "var(--color-accent-pink)",
  "var(--color-accent-orange)",
  "var(--color-accent-green)",
  "var(--color-accent-teal)",
  "var(--color-accent-purple)",
] as const;

/** The palette colour for a position in the sequence, wrapping around. */
export const brandColorAt = (index: number) =>
  BRAND_PALETTE[
    ((index % BRAND_PALETTE.length) + BRAND_PALETTE.length) %
      BRAND_PALETTE.length
  ];
