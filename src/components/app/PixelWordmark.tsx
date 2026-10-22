import React from "react";
import { PixelText } from "@/components/pixel/PixelText";

/**
 * The app's signature: its name in the shared bitmap alphabet.
 *
 * Kept as a named component because the watermark and the crash screen both
 * mean "this is Ranku", not "draw some text" — and because the wordmark is the
 * one place the name is guaranteed to survive an export byte-for-byte.
 */
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
}> = ({ word = "RANKU", height = 14, className }) => (
  <PixelText text={word} height={height} className={className} label={word.toUpperCase()} />
);
