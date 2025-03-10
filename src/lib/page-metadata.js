import { getFromKV } from './cloudflare-kv';
import { SPECTRAL_TYPES } from './constants';

export async function generateFrameMetadata({ searchParams }) {
  const { fid, type, image } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  console.log('base url', baseUrl);
  
  // Default image URL
  let imageUrl = `${baseUrl}/image.png`;
  let targetUrl = baseUrl;
  let buttonText = "Reveal Your Spectral Alignment";
  
  // If a type parameter is provided, use the corresponding spectral type image
  if (type) {
    const spectralTypeNumber = parseInt(type);
    if (spectralTypeNumber >= 1 && spectralTypeNumber <= 3) {
      // Use the appropriate image for this spectral type
      if (spectralTypeNumber === 1) {
        imageUrl = `${baseUrl}/images/axis-framer.png`;
      } else if (spectralTypeNumber === 2) {
        imageUrl = `${baseUrl}/images/flux-drifter.png`;
      } else if (spectralTypeNumber === 3) {
        imageUrl = `${baseUrl}/images/edge-disruptor.png`;
      }
      
      // Set the target URL to include the type
      targetUrl = `${baseUrl}?type=${spectralTypeNumber}`;
      
      console.log(`Using spectral type ${spectralTypeNumber} image:`, imageUrl);
    }
  } else if (image) {
    // If an image parameter is provided, use it for the frame image
    console.log('Using provided image URL:', image);
    imageUrl = image;
  } else if (fid) {
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

  console.log('Using image URL for frame:', imageUrl);

  return {
    title: "Spectral Alignment",
    description: "Discover your Spectral Alignment in the research ecosystem",
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