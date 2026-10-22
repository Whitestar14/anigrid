import { fetchJson } from "../http";
import { MediaResult, SearchMode } from "../types";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const PER_PAGE = 20;

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

export async function searchJikan(
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
