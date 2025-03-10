import { getFromKV } from './cloudflare-kv';
import { SPECTRAL_TYPES } from './constants';

export async function generateFrameMetadata({ searchParams }) {
  const { fid, type, username } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  console.log('base url', baseUrl);
  let imageUrl = `${baseUrl}/image.png`;
  let targetUrl = baseUrl;
  let buttonText = "Reveal Your Spectral Alignment";
  
  // If type is directly provided, use it for the image URL
  if (type) {
    const typeNumber = parseInt(type);
    if (!isNaN(typeNumber) && SPECTRAL_TYPES[typeNumber]) {
      // Use a direct path to the type-specific image
      const typeImagePath = typeNumber === 1 ? 'axis-framer.png' : 
                            typeNumber === 2 ? 'flux-drifter.png' : 
                            'edge-disruptor.png';
      imageUrl = `${baseUrl}/images/${typeImagePath}`;
      
      // If username is also provided, customize button text
      if (username) {
        const decodedUsername = decodeURIComponent(username);
        buttonText = `View ${decodedUsername}'s Spectral Alignment`;
      }
    }
  }
  // Fallback to using FID if type not provided
  else if (fid) {
    // Try to get the share image URL from KV
    const cacheKey = `spectral:share-image:${fid}`;
    const cachedImageUrl = await getFromKV(cacheKey);
    if (cachedImageUrl) {
      try {
        imageUrl = JSON.parse(cachedImageUrl);
        buttonText = "View Spectral Alignment";
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
    openGraph: {
      images: [imageUrl],
    },
    icons: {
      icon: `${baseUrl}/icon.png`,
      shortcut: `${baseUrl}/icon.png`,
      apple: `${baseUrl}/icon.png`,
    },
    other: {
      'fc:frame': JSON.stringify({
        "version": "next",
        "imageUrl": imageUrl,
        "button": {
          "title": buttonText,
          "action": {
            "type": "launch_frame",
            "name": "Spectral Alignment",
            "url": targetUrl,
            "splashImageUrl": `${baseUrl}/splash.png`,
            "splashBackgroundColor": "#191919"
          }
        }
      })
    }
  };
} 