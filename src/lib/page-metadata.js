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
    title: "Spectral Alignment",
    description: "Discover your Spectral Alignment in the research ecosystem",
    icons: {
      icon: "https://spec0222.vercel.app/icon.png",
      shortcut: "https://spec0222.vercel.app/icon.png",
      apple: "https://spec0222.vercel.app/icon.png",
    },
    other: {
      'fc:frame': JSON.stringify({
        "version": "1",
        "imageUrl": "https://spec0222.vercel.app/image.png",
        "button": {
          "title": "Reveal Your Spectral Alignment",
          "action": {
            "type": "launch_frame",
            "name": "Spectral Alignment",
            "url": "https://spec0222.vercel.app",
            "splashImageUrl": "https://spec0222.vercel.app/splash.png",
            "splashBackgroundColor": "#191919"
          }
        }
      })
    }
  };
} 