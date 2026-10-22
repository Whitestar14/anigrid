import {
  cacheKey,
  clearCaches,
  clearInFlight,
  getInFlight,
  readCache,
  setInFlight,
  writeCache,
} from "./cache";
import { searchAniList } from "./providers/anilist";
import { searchJikan } from "./providers/jikan";
import {
  PROVIDER_CONFIG,
  clearProviderCooldowns,
  isProviderAvailable,
  penalise,
  reward,
  schedule,
} from "./rateLimit";
import type {
  MediaResult,
  MetadataSource,
  SearchMode,
  SearchResponse,
  SourcePreference,
} from "./types";
import { MetadataError } from "./types";

export type { MetadataSource, SearchMode, SourcePreference } from "./types";
export {
  MetadataError,
  SOURCE_LABELS,
  type MediaResult,
  type SearchResponse,
} from "./types";

type Provider = (
  query: string,
  mode: SearchMode,
  signal: AbortSignal,
) => Promise<MediaResult[]>;

const PROVIDERS: Record<MetadataSource, Provider> = {
  jikan: (q, m, s) => schedule("jikan", () => searchJikan(q, m, s)),
  anilist: (q, m, s) => schedule("anilist", () => searchAniList(q, m, s)),
};

const preferenceToSource = (
  preference: SourcePreference | undefined,
): MetadataSource | null => {
  if (preference === "myanimelist") return "jikan";
  if (preference === "anilist") return "anilist";
  return null;
};

/** The default order, used when the user has expressed no preference. */
const DEFAULT_ORDER: MetadataSource[] = ["jikan", "anilist"];

/** The default order with the preferred provider moved to the front. */
const orderFor = (preference?: SourcePreference): MetadataSource[] => {
  const preferred = preferenceToSource(preference);
  if (!preferred) return DEFAULT_ORDER;
  return [preferred, ...DEFAULT_ORDER.filter((s) => s !== preferred)];
};

export interface SearchOptions {
  signal?: AbortSignal;
  /** Bypass the result cache — used by an explicit "Retry". */
  force?: boolean;
  /** Which catalogue to ask first. Defaults to the historical MAL → AniList. */
  prefer?: SourcePreference;
}

export async function searchMetadata(
  query: string,
  mode: SearchMode,
  options: SearchOptions = {},
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { results: [], source: "jikan", degraded: false };
  }

  const order = orderFor(options.prefer);
  // The preference is part of the key: switching catalogues must not serve the
  // previous catalogue's cached answer.
  const key = `${options.prefer ?? "auto"}:${cacheKey(mode, trimmed)}`;
  if (!options.force) {
    const cached = readCache(key);
    if (cached) return cached;
    const pending = getInFlight(key);
    if (pending) return pending;
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort, { once: true });

  const task = (async (): Promise<SearchResponse> => {
    const failures: string[] = [];
    let servedAnyProvider = false;

    for (const [position, source] of order.entries()) {
      if (!isProviderAvailable(source)) {
        failures.push(`${source} is cooling down`);
        continue;
      }

      const attempts = PROVIDER_CONFIG[source].maxRetries + 1;
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          const results = await PROVIDERS[source](
            trimmed,
            mode,
            controller.signal,
          );
          reward(source);
          servedAnyProvider = true;

          if (results.length === 0 && position < order.length - 1) break;

          const response: SearchResponse = {
            results,
            source,
            degraded:
              Boolean(preferenceToSource(options.prefer)) && position > 0,
          };
          writeCache(key, response);
          return response;
        } catch (error) {
          if (controller.signal.aborted) throw error;
          penalise(source, error);
          failures.push(
            `${source}: ${error instanceof Error ? error.message : "failed"}`,
          );
          break; // Move on to the next provider rather than looping.
        }
      }
    }

    if (!servedAnyProvider) {
      throw new MetadataError(
        failures.length
          ? `Search is temporarily unavailable — ${failures.join("; ")}.`
          : "Search is temporarily unavailable.",
      );
    }

    const response: SearchResponse = {
      results: [],
      source: "jikan",
      degraded: false,
    };
    writeCache(key, response);
    return response;
  })().finally(() => {
    clearInFlight(key);
    options.signal?.removeEventListener("abort", onAbort);
  });

  setInFlight(key, task);
  return task;
}

/** Clears caches and cooldowns. Used by an explicit user-triggered retry. */
export function resetMetadataService() {
  clearCaches();
  clearProviderCooldowns();
}
