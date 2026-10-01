
import { proxyEndpointUrls } from "@/utils/imageProxy";

export type MetadataSource = "jikan" | "anilist";
export type SearchMode = "anime" | "characters";

export type SourcePreference = "auto" | "myanimelist" | "anilist";

/** Human labels, so the UI never has to know provider ids. */
export const SOURCE_LABELS: Record<MetadataSource, string> = {
  jikan: "MyAnimeList",
  anilist: "AniList",
};

const preferenceToSource = (
  preference: SourcePreference | undefined
): MetadataSource | null => {
  if (preference === "myanimelist") return "jikan";
  if (preference === "anilist") return "anilist";
  return null;
};

export interface MediaResult {
  /** Globally unique across providers: `${source}:${id}`. */
  id: string;
  source: MetadataSource;
  /** MyAnimeList id, when the provider exposes one. */
  malId?: number;
  title: string;
  /** Best resolution available. */
  imageUrl: string;
  /** Small resolution, for grid thumbnails. */
  thumbnailUrl: string;
  favorites?: number;
  subtitle?: string;
}

export interface SearchResponse {
  results: MediaResult[];
  source: MetadataSource;
  /** True when the primary provider was unavailable and we fell back. */
  degraded: boolean;
}

export class MetadataError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "rate-limit" | "server" | "empty" = "server",
    readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "MetadataError";
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Rate limiting, caching and provider health
   ───────────────────────────────────────────────────────────────────────── */

interface ProviderConfig {
  id: MetadataSource;
  /** Minimum gap between two requests to this provider. */
  minIntervalMs: number;
  /** How long to stop calling it after a failure. */
  cooldownMs: number;
  maxRetries: number;
}

const CONFIG: Record<MetadataSource, ProviderConfig> = {
  // 350ms ≈ 2.8 req/s — just under Jikan's 3/s ceiling.
  jikan: { id: "jikan", minIntervalMs: 350, cooldownMs: 15_000, maxRetries: 1 },
  // 2000ms = 30 req/min, which stays inside AniList's *degraded* budget so we
  // never contribute to the pressure that got it degraded in the first place.
  anilist: {
    id: "anilist",
    minIntervalMs: 2000,
    cooldownMs: 30_000,
    maxRetries: 1,
  },
};

interface ProviderRuntime {
  /** Tail of the serialised request chain. */
  chain: Promise<unknown>;
  lastStartedAt: number;
  cooldownUntil: number;
  consecutiveFailures: number;
}

const runtime: Record<MetadataSource, ProviderRuntime> = {
  jikan: {
    chain: Promise.resolve(),
    lastStartedAt: 0,
    cooldownUntil: 0,
    consecutiveFailures: 0,
  },
  anilist: {
    chain: Promise.resolve(),
    lastStartedAt: 0,
    cooldownUntil: 0,
    consecutiveFailures: 0,
  },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs `task` with the provider's rate discipline applied. Everything is
 * chained onto a single promise so two callers can never overlap, and the
 * queue waits out the minimum interval before starting.
 */
function schedule<T>(source: MetadataSource, task: () => Promise<T>): Promise<T> {
  const cfg = CONFIG[source];
  const rt = runtime[source];

  const run = async (): Promise<T> => {
    const wait = rt.lastStartedAt + cfg.minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    rt.lastStartedAt = Date.now();
    return task();
  };

  // Swallow rejections on the stored chain so one failure cannot poison the
  // queue for subsequent callers.
  const result = rt.chain.then(run, run);
  rt.chain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export function isProviderAvailable(source: MetadataSource) {
  return Date.now() >= runtime[source].cooldownUntil;
}

function penalise(source: MetadataSource, error: unknown) {
  const cfg = CONFIG[source];
  const rt = runtime[source];
  rt.consecutiveFailures += 1;

  // Honour an explicit Retry-After when the server exposes one cross-origin
  // (it often does not), otherwise back off exponentially.
  const hinted =
    error instanceof MetadataError && error.retryAfterMs
      ? error.retryAfterMs
      : cfg.cooldownMs * Math.min(rt.consecutiveFailures, 4);

  rt.cooldownUntil = Date.now() + hinted;
}

function reward(source: MetadataSource) {
  runtime[source].consecutiveFailures = 0;
}

/* ── Result cache ───────────────────────────────────────────────────────── */

const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 60;
const cache = new Map<string, { at: number; value: SearchResponse }>();
const inFlight = new Map<string, Promise<SearchResponse>>();

function cacheKey(mode: SearchMode, query: string) {
  return `${mode}:${query.trim().toLowerCase()}`;
}

function readCache(key: string): SearchResponse | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function writeCache(key: string, value: SearchResponse) {
  cache.set(key, { at: Date.now(), value });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Providers
   ───────────────────────────────────────────────────────────────────────── */

const JIKAN_BASE = "https://api.jikan.moe/v4";
const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const PER_PAGE = 20;

const ANILIST_ENDPOINTS: string[] = [
  ...proxyEndpointUrls("/proxy/anilist"),
  ANILIST_ENDPOINT,
];

/** Reads Retry-After (seconds) when the browser is allowed to see it. */
function retryAfterFrom(response: Response): number | undefined {
  try {
    const header = response.headers.get("retry-after");
    if (!header) return undefined;
    const seconds = Number(header);
    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
  } catch {
    return undefined;
  }
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new MetadataError("Could not reach the service.", "network");
  }

  if (response.status === 429) {
    throw new MetadataError(
      "Rate limited.",
      "rate-limit",
      retryAfterFrom(response)
    );
  }
  if (response.status >= 500) {
    throw new MetadataError("Service is unavailable.", "server");
  }
  if (!response.ok) {
    throw new MetadataError(`Request failed (${response.status}).`);
  }
  return response.json();
}

interface JikanImage {
  jpg?: { image_url?: string; large_image_url?: string };
  webp?: { image_url?: string; large_image_url?: string };
}
interface JikanEntry {
  mal_id: number;
  title?: string;
  title_english?: string;
  name?: string;
  favorites?: number;
  images?: JikanImage;
}

async function searchJikan(
  query: string,
  mode: SearchMode,
  signal: AbortSignal
): Promise<MediaResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(PER_PAGE),
    order_by: "favorites",
    sort: "desc",
  });
  if (mode === "anime") params.set("sfw", "true");

  const payload = (await fetchJson(
    `${JIKAN_BASE}/${mode}?${params.toString()}`,
    { signal }
  )) as { data?: JikanEntry[] };

  return (payload.data ?? []).flatMap((entry) => {
    const images = entry.images?.webp ?? entry.images?.jpg;
    const image = images?.large_image_url || images?.image_url;
    if (!image) return [];
    return [
      {
        id: `jikan:${entry.mal_id}`,
        source: "jikan" as const,
        malId: entry.mal_id,
        title: entry.title_english || entry.title || entry.name || "Unknown",
        imageUrl: image,
        thumbnailUrl: images?.image_url || image,
        favorites: entry.favorites,
      },
    ];
  });
}

const ANILIST_ANIME_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: ANIME, sort: [FAVOURITES_DESC], isAdult: false) {
        id
        idMal
        title { english romaji userPreferred }
        coverImage { extraLarge large medium }
        favourites
      }
    }
  }
`;

const ANILIST_CHARACTER_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      characters(search: $search, sort: [FAVOURITES_DESC]) {
        id
        name { full native userPreferred }
        image { large medium }
        favourites
      }
    }
  }
`;

interface AniListMedia {
  id: number;
  idMal?: number;
  title?: { english?: string; romaji?: string; userPreferred?: string };
  coverImage?: { extraLarge?: string; large?: string; medium?: string };
  favourites?: number;
}
interface AniListCharacter {
  id: number;
  name?: { full?: string; native?: string; userPreferred?: string };
  image?: { large?: string; medium?: string };
  favourites?: number;
}

async function searchAniList(
  query: string,
  mode: SearchMode,
  signal: AbortSignal
): Promise<MediaResult[]> {
  const init: RequestInit = {
    method: "POST",
    signal,
    mode: "cors",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: mode === "anime" ? ANILIST_ANIME_QUERY : ANILIST_CHARACTER_QUERY,
      variables: { search: query, perPage: PER_PAGE },
    }),
  };

  // Walk the endpoints; only the last failure is worth reporting, and only when
  // every route is exhausted.
  let lastError: unknown = new MetadataError("AniList is unavailable.", "network");
  let payload: {
    data?: { Page?: { media?: AniListMedia[]; characters?: AniListCharacter[] } };
    errors?: { message: string }[];
  } | null = null;

  for (const endpoint of ANILIST_ENDPOINTS) {
    try {
      payload = (await fetchJson(endpoint, init)) as typeof payload;
      break;
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
    }
  }

  if (!payload) throw lastError;
  const resolved = payload;

  if (resolved.errors?.length) {
    throw new MetadataError(resolved.errors[0].message);
  }

  if (mode === "anime") {
    return (resolved.data?.Page?.media ?? []).flatMap((media) => {
      const image =
        media.coverImage?.extraLarge ||
        media.coverImage?.large ||
        media.coverImage?.medium;
      if (!image) return [];
      const title =
        media.title?.english ||
        media.title?.romaji ||
        media.title?.userPreferred ||
        "Unknown";
      return [
        {
          id: `anilist:${media.id}`,
          source: "anilist" as const,
          malId: media.idMal,
          title,
          imageUrl: image,
          thumbnailUrl: media.coverImage?.medium || image,
          favorites: media.favourites,
        },
      ];
    });
  }

  return (resolved.data?.Page?.characters ?? []).flatMap((character) => {
    const image = character.image?.large || character.image?.medium;
    if (!image) return [];
    return [
      {
        id: `anilist:${character.id}`,
        source: "anilist" as const,
        title:
          character.name?.full ||
          character.name?.userPreferred ||
          character.name?.native ||
          "Unknown",
        imageUrl: image,
        thumbnailUrl: character.image?.medium || image,
        favorites: character.favourites,
      },
    ];
  });
}

type Provider = (
  query: string,
  mode: SearchMode,
  signal: AbortSignal
) => Promise<MediaResult[]>;

const PROVIDERS: Record<MetadataSource, Provider> = {
  jikan: (q, m, s) => schedule("jikan", () => searchJikan(q, m, s)),
  anilist: (q, m, s) => schedule("anilist", () => searchAniList(q, m, s)),
};

/** The default order, used when the user has expressed no preference. */
const DEFAULT_ORDER: MetadataSource[] = ["jikan", "anilist"];

/** The default order with the preferred provider moved to the front. */
const orderFor = (preference?: SourcePreference): MetadataSource[] => {
  const preferred = preferenceToSource(preference);
  if (!preferred) return DEFAULT_ORDER;
  return [preferred, ...DEFAULT_ORDER.filter((s) => s !== preferred)];
};

/* ─────────────────────────────────────────────────────────────────────────
   Public API
   ───────────────────────────────────────────────────────────────────────── */

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
  options: SearchOptions = {}
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
    const pending = inFlight.get(key);
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

      const attempts = CONFIG[source].maxRetries + 1;
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          const results = await PROVIDERS[source](trimmed, mode, controller.signal);
          reward(source);
          servedAnyProvider = true;

          // An empty result set is a valid answer for the primary provider,
          // but a good reason to ask the fallback too — catalogues differ.
          if (results.length === 0 && position < order.length - 1) break;

          const response: SearchResponse = {
            results,
            source,
            degraded: position > 0,
          };
          writeCache(key, response);
          return response;
        } catch (error) {
          if (controller.signal.aborted) throw error;
          penalise(source, error);
          failures.push(
            `${source}: ${error instanceof Error ? error.message : "failed"}`
          );
          break; // Move on to the next provider rather than looping.
        }
      }
    }

    if (!servedAnyProvider) {
      throw new MetadataError(
        failures.length
          ? `Search is temporarily unavailable — ${failures.join("; ")}.`
          : "Search is temporarily unavailable."
      );
    }

    const response: SearchResponse = { results: [], source: "jikan", degraded: false };
    writeCache(key, response);
    return response;
  })().finally(() => {
    inFlight.delete(key);
    options.signal?.removeEventListener("abort", onAbort);
  });

  inFlight.set(key, task);
  return task;
}

/** Clears caches and cooldowns. Used by an explicit user-triggered retry. */
export function resetMetadataService() {
  cache.clear();
  inFlight.clear();
  (Object.keys(runtime) as MetadataSource[]).forEach((source) => {
    runtime[source].cooldownUntil = 0;
    runtime[source].consecutiveFailures = 0;
  });
}
