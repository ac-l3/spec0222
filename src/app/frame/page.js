// This is a server component (no 'use client' directive)
import { SPECTRAL_TYPES } from '../../lib/constants';
import { getFromKV } from '../../lib/cloudflare-kv';

// This is a simple Frame implementation using the Farcaster Frame specification
export default async function FramePage({ searchParams }) {
  const { fid, type, username } = searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  // Determine image URL based on type or FID
  let imageUrl = `${baseUrl}/image.png`;
  let targetUrl = baseUrl;
  let buttonText = "Reveal Your Spectral Alignment";
  
  // If type is directly provided, use it for the image URL
  if (type) {
    const typeNumber = parseInt(type);
    if (!isNaN(typeNumber) && SPECTRAL_TYPES[typeNumber]) {
      // Use the specific spectral type image
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
      } catch (e) {
        console.error('Error parsing cached image URL:', e);
        imageUrl = cachedImageUrl; // fallback to raw value if parsing fails
      }
    }
    // Add fid to the target URL
    targetUrl = `${baseUrl}?fid=${fid}`;
  }
  
  // Construct parameter string for the redirect URL
  let redirectParams = [];
  if (fid) redirectParams.push(`fid=${fid}`);
  if (type) redirectParams.push(`type=${type}`);
  if (username) redirectParams.push(`username=${encodeURIComponent(username || '')}`);
  
  const redirectUrl = redirectParams.length > 0 
    ? `${baseUrl}?${redirectParams.join('&')}` 
    : baseUrl;

  // Return HTML with frame meta tags
  return (
    <html>
      <head>
        <title>Spectral Alignment</title>
        <meta property="og:title" content="Spectral Alignment" />
        <meta property="og:description" content="Discover your Spectral Alignment in the research ecosystem" />
        <meta property="og:image" content={imageUrl} />
        
        {/* Farcaster Frame tags */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={imageUrl} />
        <meta property="fc:frame:button:1" content={buttonText} />
        <meta property="fc:frame:post_url" content={redirectUrl} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{
          __html: `window.location.href = "${redirectUrl}";`
        }} />
      </body>
    </html>
  );
} 