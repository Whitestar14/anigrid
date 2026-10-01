
/** From `.env`; unset in a bare checkout. */
const CONFIGURED_PROXY = (
  (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_IMAGE_PROXY_URL ?? ""
).trim();

/** The deployed image proxy (see `render.yaml` / `backend/app.py`). */
const DEPLOYED_PROXY = "https://anigrid-api.onrender.com/proxy/image";

const isInline = (url: string) =>
  url.startsWith("data:") || url.startsWith("blob:");

export function proxyUrlFor(base: string, externalUrl: string) {
  return `${base}?url=${encodeURIComponent(externalUrl)}`;
}

/**
 * Back-compat helper for places that just want "a URL that will probably work"
 * (drag overlays, anchors). Prefer `RemoteImage`, which can fall back.
 */
export const getProxiedImageUrl = (
  externalUrl: string,
  base: string = CONFIGURED_PROXY || DEPLOYED_PROXY
): string => {
  if (!externalUrl || typeof externalUrl !== "string" || isInline(externalUrl)) {
    return externalUrl || "";
  }
  if (!base) return externalUrl;
  return proxyUrlFor(base, externalUrl);
};

export interface ImageCandidate {
  url: string;
  /** Identifies the strategy, for the per-origin preference cache. */
  key: string;
}

const proxyBases = (): string[] =>
  [CONFIGURED_PROXY, DEPLOYED_PROXY].filter(
    (base, i, all) => !!base && all.indexOf(base) === i
  );

/**
 * Endpoints on each configured proxy host for a sibling route, e.g.
 * `/proxy/anilist`. Used to route metadata through the backend so it gets the
 * same server-side guards as images.
 */
export function proxyEndpointUrls(path: string): string[] {
  return proxyBases()
    .map((base) => {
      try {
        return new URL(base).origin + path;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

export function originOf(url: string): string | null {
  try {
    return new URL(url, window.location.href).origin;
  } catch {
    return null;
  }
}

/** The ordered ways to try loading `src`. */
export function imageCandidates(src: string): ImageCandidate[] {
  if (!src) return [];
  if (isInline(src)) return [{ url: src, key: "inline" }];

  const candidates: ImageCandidate[] = proxyBases().map((base) => ({
    url: proxyUrlFor(base, src),
    key: base,
  }));

  // The origin last: fastest and needs no server, but only works for hosts that
  // permit hotlinking.
  candidates.push({ url: src, key: "direct" });
  return candidates;
}

/**
 * Candidate index that last worked for an origin, shared process-wide so a
 * board full of the same host does not rediscover it per tile.
 */
export const originPreference = new Map<string, number>();

export async function fetchImageBlob(src: string): Promise<Blob | null> {
  if (!src) return null;
  if (isInline(src)) {
    try {
      return await (await fetch(src)).blob();
    } catch {
      return null;
    }
  }

  for (const candidate of imageCandidates(src)) {
    try {
      const response = await fetch(candidate.url, {
        mode: "cors",
        credentials: "omit",
      });
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.size > 0) return blob;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

export async function downloadImage(
  src: string,
  filename: string
): Promise<boolean> {
  const blob = await fetchImageBlob(src);
  if (blob) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Revoke on the next frame: revoking synchronously can cancel the download
    // in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  }

  window.open(getProxiedImageUrl(src), "_blank", "noopener,noreferrer");
  return false;
}
