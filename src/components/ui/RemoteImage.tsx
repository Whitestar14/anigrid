import React, { useEffect, useMemo, useRef, useState } from "react";
import { imageCandidates, originOf, originPreference } from "@/utils/imageProxy";

export interface RemoteImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  /** Rendered when every candidate fails. */
  fallback?: React.ReactNode;
  /** Suppress the loading placeholder (for places that draw their own). */
  noPlaceholder?: boolean;
}

/** The candidate index that last loaded for a given origin. */
const originIndex = originPreference;

/** source → the candidate URL that actually worked. */
const resolvedSrc = new Map<string, string>();
/** source → bytes are already decoded, so there is nothing to wait for. */
const loadedSrc = new Set<string>();
/** source → every candidate failed; do not ask again this session. */
const failedSrc = new Set<string>();

export const RemoteImage: React.FC<RemoteImageProps> = ({
  src,
  fallback = null,
  onError,
  onLoad,
  className = "",
  noPlaceholder = false,
  style,
  ...props
}) => {
  const candidates = useMemo(() => imageCandidates(src), [src]);
  const origin = useMemo(() => (src ? originOf(src) : null), [src]);

  const cachedUrl = resolvedSrc.get(src);
  const startIndex = cachedUrl
    ? Math.max(
        0,
        candidates.findIndex((c) => c.url === cachedUrl)
      )
    : origin
      ? (originIndex.get(origin) ?? 0)
      : 0;

  const [index, setIndex] = useState(startIndex);
  const [failed, setFailed] = useState(() => failedSrc.has(src));
  // Seeded from the cache so a remount paints the image on its first frame
  // instead of fading in from nothing.
  const [loaded, setLoaded] = useState(() => loadedSrc.has(src));
  const imgRef = useRef<HTMLImageElement>(null);

  const candidate = candidates[Math.min(index, candidates.length - 1)];

  useEffect(() => {
    if (loadedSrc.has(src)) {
      setLoaded(true);
      setFailed(failedSrc.has(src));
      return;
    }
    const cached = resolvedSrc.get(src);
    setIndex(
      cached
        ? Math.max(
            0,
            candidates.findIndex((c) => c.url === cached)
          )
        : origin
          ? (originIndex.get(origin) ?? 0)
          : 0
    );
    setFailed(false);
    setLoaded(false);
  }, [src, origin, candidates]);

  /* A cached image can complete before React attaches `onLoad`, which would
     leave it stuck at opacity 0 forever. `complete` + a natural size is the
     only reliable way to ask whether the bytes are already there. */
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      loadedSrc.add(src);
      setLoaded(true);
    }
  }, [src, candidate?.url]);

  if (!src || failed || !candidate) return <>{fallback}</>;

  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <img
        {...props}
        ref={imgRef}
        src={candidate.url}
        draggable={false}
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300 ease-standard"
        style={{
          ...style,
          // `style` may already carry a transform/object-position, so only the
          // opacity is owned here.
          opacity: loaded ? (style?.opacity ?? 1) : 0,
        }}
        onLoad={(event) => {
          if (origin) originIndex.set(origin, index);
          if (candidate) resolvedSrc.set(src, candidate.url);
          loadedSrc.add(src);
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          if (index + 1 < candidates.length) {
            setIndex(index + 1);
            return;
          }
          failedSrc.add(src);
          setFailed(true);
          onError?.(event);
        }}
      />
      {!loaded && !noPlaceholder && (
        <span aria-hidden className="img-sheen" />
      )}
    </span>
  );
};
