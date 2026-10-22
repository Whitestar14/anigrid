import { MetadataError } from "./types";

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

export async function fetchJson(
  url: string,
  init: RequestInit
): Promise<unknown> {
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
