import { getFromKV } from './cloudflare-kv';
import { SPECTRAL_TYPES } from './constants';

export async function generateFrameMetadata({ searchParams }) {
  const { fid, type, image, t } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  console.log('Generating frame metadata with params:', { fid, type, image, t });
  console.log('Base URL:', baseUrl);
  
  // Default image URL
  let imageUrl = `${baseUrl}/image.png`;
  let targetUrl = baseUrl;
  let buttonText = "Reveal Your Spectral Alignment";
  
  // If a type parameter is provided, use the corresponding static share image
  if (type) {
    const spectralTypeNumber = parseInt(type);
    if (spectralTypeNumber >= 1 && spectralTypeNumber <= 3) {
      // Use the new static share image for this spectral type
      const shareImagePath = `/images/type-${spectralTypeNumber}-share.png`;
      imageUrl = `${baseUrl}${shareImagePath}`;
      
      // Set the target URL to include the type
      targetUrl = `${baseUrl}?type=${spectralTypeNumber}`;
      
      console.log(`Using spectral type ${spectralTypeNumber} share image:`, imageUrl);
      
      // Verify the image exists by logging
      console.log(`Image path should be: ${shareImagePath}`);
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

  console.log('Final image URL for frame:', imageUrl);
  
  const frameMetadata = {
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
  
  console.log('Generated frame metadata:', JSON.stringify(frameMetadata.other['fc:frame']));
  
  return frameMetadata;
} 