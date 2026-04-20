/**
 * Image proxy utility for fetching CORS-blocked images through backend proxy
 */

const PROXY_URL = import.meta.env.VITE_IMAGE_PROXY_URL || 'http://localhost:5000/proxy/image';

export const getProxiedImageUrl = (externalUrl: string): string => {
  if (!externalUrl || externalUrl.startsWith('data:')) {
    return externalUrl;
  }

  // If using proxy, encode the URL parameter
  return `${PROXY_URL}?url=${encodeURIComponent(externalUrl)}`;
};

export const fetchImageThroughProxy = async (
  externalUrl: string
): Promise<string | null> => {
  try {
    const response = await fetch(getProxiedImageUrl(externalUrl));
    if (!response.ok) {
      console.error(`Proxy fetch failed: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Proxy fetch error:', err);
    return null;
  }
};
