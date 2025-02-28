import { getFromKV } from './cloudflare-kv';

export async function generateFrameMetadata({ searchParams }) {
  const { fid } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  console.log('base url', baseUrl);
  let imageUrl = "https://cover-art.kasra.codes/enneagram-icon-512-square.png";
  let targetUrl = baseUrl;
  let buttonText = "Analyze My Research Style";

  if (fid) {
    // Try to get the share image URL from KV
    const cacheKey = `spectral:share-image:${fid}`;
    const cachedImageUrl = await getFromKV(cacheKey);
    if (cachedImageUrl) {
      try {
        imageUrl = JSON.parse(cachedImageUrl);
        buttonText = "Discover Your Research Style";
      } catch (e) {
        console.error('Error parsing cached image URL:', e);
        imageUrl = cachedImageUrl; // fallback to raw value if parsing fails
      }
    }
    // Add fid to the target URL
    targetUrl = `${baseUrl}?fid=${fid}`;
  }

  console.log('image url', imageUrl);

  return {
    title: "Spectral Researcher",
    description: "Discover your unique research style in the Spectral ecosystem",
    icons: {
      icon: "https://cover-art.kasra.codes/enneagram-icon-512.png",
      shortcut: "https://cover-art.kasra.codes/enneagram-icon-512.png",
      apple: "https://cover-art.kasra.codes/enneagram-icon-512.png",
    },
    other: {
      'fc:frame': JSON.stringify({
        "version": "next",
        "imageUrl": "https://cover-art.kasra.codes/enneagram-icon-512-square.png",
        "button": {
          "title": "Analyze My Research Style",
          "action": {
            "type": "launch_frame",
            "name": "Spectral Researcher",
            "url": "https://spec0222.vercel.app",
            "splashImageUrl": "https://cover-art.kasra.codes/enneagram-icon-512.png",
            "splashBackgroundColor": "#222222"
          }
        }
      })
    }
  };
} 