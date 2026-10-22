import { MetadataError, MetadataSource } from "./types";

interface ProviderConfig {
  id: MetadataSource;
  /** Minimum gap between two requests to this provider. */
  minIntervalMs: number;
  /** How long to stop calling it after a failure. */
  cooldownMs: number;
  maxRetries: number;
}

interface ProviderRuntime {
  /** Tail of the serialised request chain. */
  chain: Promise<unknown>;
  lastStartedAt: number;
  cooldownUntil: number;
  consecutiveFailures: number;
}

export const PROVIDER_CONFIG: Record<MetadataSource, ProviderConfig> = {
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
 * chained onto a single promise so two callers can never overlap, and the queue
 * waits out the minimum interval before starting.
 */
export function schedule<T>(
  source: MetadataSource,
  task: () => Promise<T>
): Promise<T> {
  const cfg = PROVIDER_CONFIG[source];
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

export function penalise(source: MetadataSource, error: unknown) {
  const cfg = PROVIDER_CONFIG[source];
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

export function reward(source: MetadataSource) {
  runtime[source].consecutiveFailures = 0;
}

export function clearProviderCooldowns() {
  (Object.keys(runtime) as MetadataSource[]).forEach((source) => {
    runtime[source].cooldownUntil = 0;
    runtime[source].consecutiveFailures = 0;
  });
}
