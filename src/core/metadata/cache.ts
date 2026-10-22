import { SearchMode, SearchResponse } from "./types";

const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 60;

const cache = new Map<string, { at: number; value: SearchResponse }>();
const inFlight = new Map<string, Promise<SearchResponse>>();

export function cacheKey(mode: SearchMode, query: string) {
  return `${mode}:${query.trim().toLowerCase()}`;
}

export function readCache(key: string): SearchResponse | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

export function writeCache(key: string, value: SearchResponse) {
  cache.set(key, { at: Date.now(), value });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export function getInFlight(key: string) {
  return inFlight.get(key);
}

export function setInFlight(key: string, task: Promise<SearchResponse>) {
  inFlight.set(key, task);
}

export function clearInFlight(key: string) {
  inFlight.delete(key);
}

export function clearCaches() {
  cache.clear();
  inFlight.clear();
}
