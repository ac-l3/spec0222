import { getFromKV } from './cloudflare-kv';

export async function generateFrameMetadata({ searchParams }) {
  const { fid } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  console.log('base url', baseUrl);
  let imageUrl = "https://spec0222.vercel.app/image.png";
  let targetUrl = baseUrl;
  let buttonText = "Reveal Your Spectral Alignment";

  if (fid) {
    // Try to get the share image URL from KV
    const cacheKey = `spectral:share-image:${fid}`;
    const cachedImageUrl = await getFromKV(cacheKey);
    if (cachedImageUrl) {
      try {
        imageUrl = JSON.parse(cachedImageUrl);
        buttonText = "Reveal Your Spectral Alignment";
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
        "imageUrl": "https://spec0222.vercel.app/image.png",
        "button": {
          "title": "Reveal Your Spectral Alignment",
          "action": {
            "type": "launch_frame",
            "name": "Spectral Researcher",
            "url": "https://spec0222.vercel.app",
            "splashImageUrl": "https://spec0222.vercel.app/splash.png",
            "splashBackgroundColor": "#191919"
          }
        }
      })
    }
  };
} 