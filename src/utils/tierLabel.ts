/** Line box as a multiple of the type size. Mirrors what the span renders. */
export const TIER_LABEL_LINE_HEIGHT = 1.15;
/** Horizontal room the block spends on padding, in px (2 × 6). */
const BLOCK_PADDING_X = 12;
/** Vertical room the block keeps clear of its own edges, in px. */
const BLOCK_PADDING_Y = 10;
const MIN_SIZE = 8;
const MAX_SIZE = 46;
/** Type is measured once at this size and scaled, for sub-pixel accuracy. */
const REFERENCE_SIZE = 100;

const FONT_STACK =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const FONT = `700 ${REFERENCE_SIZE}px ${FONT_STACK}`;

let measuringContext: CanvasRenderingContext2D | null = null;

/** Width of `text` at `size`, in px. */
const advance = (text: string, size: number): number => {
  if (!text) return 0;
  if (!measuringContext) {
    measuringContext = document.createElement("canvas").getContext("2d");
    if (measuringContext) measuringContext.font = FONT;
  }
  /* No canvas (very old browsers, or a test environment): fall back to the
     average advance of a bold sans, which is close enough to keep the label
     inside its block. */
  if (!measuringContext) return text.length * size * 0.56;
  return (measuringContext.measureText(text).width * size) / REFERENCE_SIZE;
};

/** Greedy line breaking on spaces, exactly as the browser will break it. */
const countLines = (
  words: string[],
  size: number,
  maxWidth: number,
): number => {
  const space = advance(" ", size);
  let lines = 1;
  let lineWidth = 0;

  for (const word of words) {
    const width = advance(word, size);
    if (lineWidth === 0) {
      lineWidth = width;
    } else if (lineWidth + space + width <= maxWidth) {
      lineWidth += space + width;
    } else {
      lines += 1;
      lineWidth = width;
    }
  }

  return lines;
};

export interface TierLabelFit {
  /** Type size in px. */
  fontSize: number;
  /** How many lines the block can show, for the safety clamp. */
  lines: number;
  /** True when even the smallest size cannot hold the longest word: break it. */
  breaksWords: boolean;
  lineHeight: number;
}

/**
 * The largest size at which `label` fits `width` × `height`, never breaking a
 * word. If no size works, the smallest size is used and words are allowed to
 * break — the label stays inside its block either way.
 */
export const fitTierLabel = (
  label: string,
  width: number,
  height: number,
  /** Ceiling for the size, so a tall block does not produce billboard type. */
  cap = MAX_SIZE,
): TierLabelFit => {
  const text = (label ?? "").trim() || "?";
  const words = text.split(/\s+/);
  const longest = words.reduce(
    (a, b) => (advance(b, REFERENCE_SIZE) > advance(a, REFERENCE_SIZE) ? b : a),
    words[0],
  );

  const usableWidth = Math.max(8, width - BLOCK_PADDING_X);
  const usableHeight = Math.max(8, height - BLOCK_PADDING_Y);
  const ceiling = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(cap)));

  for (let size = ceiling; size >= MIN_SIZE; size--) {
    const lineHeight = size * TIER_LABEL_LINE_HEIGHT;
    if (advance(longest, size) > usableWidth) continue;
    const lines = countLines(words, size, usableWidth);
    if (lines * lineHeight > usableHeight) continue;
    return {
      fontSize: size,
      lines,
      breaksWords: false,
      lineHeight: TIER_LABEL_LINE_HEIGHT,
    };
  }

  /* Nothing fits: a single unbreakable word wider than the block (a 24-char
     handle, say). Keep the type small and let it break mid-word, clipped to the
     rows the block can show. */
  const lineHeight = MIN_SIZE * TIER_LABEL_LINE_HEIGHT;
  return {
    fontSize: MIN_SIZE,
    lines: Math.max(1, Math.min(6, Math.floor(usableHeight / lineHeight))),
    breaksWords: true,
    lineHeight: TIER_LABEL_LINE_HEIGHT,
  };
};
