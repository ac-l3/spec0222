import { getFromKV } from './cloudflare-kv';

export async function generateFrameMetadata({ searchParams }) {
  const { fid, image } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  console.log('base url', baseUrl);
  let imageUrl = "https://cover-art.kasra.codes/enneagram-icon-512-square.png";
  let targetUrl = baseUrl;
  let buttonText = "Analyze My Research Style";

  // If image parameter is provided, use it directly
  if (image) {
    // Construct the full image URL using the R2 public URL
    imageUrl = `${process.env.R2_PUBLIC_URL}/${image}`;
    console.log('Using image from URL parameter:', imageUrl);
  } 
  // Otherwise, try to get the image from KV based on FID
  else if (fid) {
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
        version: "next",
        imageUrl,
        button: {
          title: buttonText,
          action: {
            type: "launch_frame",
            name: "Spectral Researcher",
            url: targetUrl,
            splashImageUrl: "https://cover-art.kasra.codes/enneagram-icon-512.png",
            splashBackgroundColor: "#222222"
          }
        }
      })
    }
  };
} 