import { getFromKV } from './cloudflare-kv';
import { SPECTRAL_TYPES } from './constants';

export async function generateFrameMetadata({ searchParams }) {
  const { fid, type, username } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  console.log('base url', baseUrl);
  
  // Default image and button text
  let imageUrl = `${baseUrl}/image.png`;
  let targetUrl = baseUrl;
  let buttonText = "Reveal Your Spectral Alignment";
  
  // Generate a better OG image
  if (fid || type) {
    // Generate direct URL to the OG endpoint which gives us the exact spectral result image
    const ogParams = [];
    if (fid) ogParams.push(`fid=${fid}`);
    if (type) ogParams.push(`type=${type}`);
    if (username) ogParams.push(`username=${encodeURIComponent(username)}`);
    
    // Use the OG API directly as the image URL - this will generate the dynamic image shown in the 2nd screenshot
    imageUrl = `${baseUrl}/api/og?${ogParams.join('&')}`;
    console.log('Using OG image URL:', imageUrl);
    
    // Customize button text based on username
    if (username) {
      const decodedUsername = decodeURIComponent(username);
      buttonText = `View ${decodedUsername}'s Spectral Alignment`;
    } else {
      buttonText = "View Spectral Alignment";
    }
    
    // Set target URL
    if (fid) {
      targetUrl = `${baseUrl}?fid=${fid}`;
      if (type) targetUrl += `&type=${type}`;
    }
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