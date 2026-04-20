import { get, set } from "idb-keyval";

const IMAGE_CACHE_KEY = "image-cache";

/**
 * Clear old cached images (older than 7 days)
 */
export const cleanupOldCache = async (): Promise<void> => {
  try {
    const cache = (await get(IMAGE_CACHE_KEY)) || {};
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    let cleaned = false;
    for (const key in cache) {
      if (cache[key].timestamp < sevenDaysAgo) {
        delete cache[key];
        cleaned = true;
      }
    }

    if (cleaned) {
      await set(IMAGE_CACHE_KEY, cache);
    }
  } catch (err) {
    console.warn("Failed to cleanup image cache", err);
  }
};
