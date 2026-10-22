import { proxyEndpointUrls } from "@/utils/imageProxy";
import { fetchJson } from "../http";
import { MetadataError, MediaResult, SearchMode } from "../types";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const PER_PAGE = 20;

/** The Appwrite proxy first, the public API as the fallback route. */
const ANILIST_ENDPOINTS: string[] = [
  ...proxyEndpointUrls("/proxy/anilist"),
  ANILIST_ENDPOINT,
];

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

interface AniListPayload {
  data?: {
    Page?: { media?: AniListMedia[]; characters?: AniListCharacter[] };
  };
  errors?: { message: string }[];
}

function toMedia(media: AniListMedia): MediaResult[] {
  const image =
    media.coverImage?.extraLarge ||
    media.coverImage?.large ||
    media.coverImage?.medium;
  if (!image) return [];
  return [
    {
      id: `anilist:${media.id}`,
      source: "anilist" as const,
      malId: media.idMal,
      title:
        media.title?.english ||
        media.title?.romaji ||
        media.title?.userPreferred ||
        "Unknown",
      imageUrl: image,
      thumbnailUrl: media.coverImage?.medium || image,
      favorites: media.favourites,
    },
  ];
}

function toCharacter(character: AniListCharacter): MediaResult[] {
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
}

export async function searchAniList(
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
  let lastError: unknown = new MetadataError(
    "AniList is unavailable.",
    "network"
  );
  let payload: AniListPayload | null = null;

  for (const endpoint of ANILIST_ENDPOINTS) {
    try {
      payload = (await fetchJson(endpoint, init)) as AniListPayload;
      break;
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
    }
  }

  if (!payload) throw lastError;

  if (payload.errors?.length) {
    throw new MetadataError(payload.errors[0].message);
  }

  const page = payload.data?.Page;
  if (mode === "anime") return (page?.media ?? []).flatMap(toMedia);
  return (page?.characters ?? []).flatMap(toCharacter);
}
