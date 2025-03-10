// This is a server component (no 'use client' directive)
import { SPECTRAL_TYPES } from '../../lib/constants';

// This is a simple Frame implementation using the Farcaster Frame specification
export default async function FramePage({ searchParams }) {
  const { fid, type, username, cb } = searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  // Use cache buster if provided or generate a new one
  const cacheBuster = cb || Date.now().toString();
  
  // Determine image URL based on type or FID
  let imageUrl = `${baseUrl}/image.png`;
  let targetUrl = baseUrl;
  let buttonText = "Reveal Your Spectral Alignment";
  
  // If type is directly provided, use it for the image URL
  if (type) {
    const typeNumber = parseInt(type);
    if (!isNaN(typeNumber) && SPECTRAL_TYPES[typeNumber]) {
      // Always use dynamic OG image with username and type for personalized visualization
      imageUrl = `${baseUrl}/api/og?username=${encodeURIComponent(username || 'researcher')}&type=${typeNumber}&cb=${cacheBuster}`;
      
      if (username) {
        const decodedUsername = decodeURIComponent(username);
        buttonText = `View ${decodedUsername}'s Spectral Alignment`;
      }
    }
  }
  // Fallback to using FID if type not provided
  else if (fid) {
    // Generate OG URL directly with username for personalized visualization
    imageUrl = `${baseUrl}/api/og?fid=${fid}&cb=${cacheBuster}`;
    if (username) {
      imageUrl += `&username=${encodeURIComponent(username)}`;
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

  // Following the tutorial guidance for frame implementation
  return (
    <html>
      <head>
        <title>Spectral Alignment</title>
        
        {/* Frame tags first - order matters for some clients */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={imageUrl} />
        <meta property="fc:frame:button:1" content={buttonText} />
        <meta property="fc:frame:post_url" content={redirectUrl} />
        
        {/* OG tags after fc tags */}
        <meta property="og:title" content="Spectral Alignment" />
        <meta property="og:description" content="Discover your Spectral Alignment in the research ecosystem" />
        <meta property="og:image" content={imageUrl} />
      </head>
      <body>
        <h1>Spectral Alignment</h1>
        <p>If you're seeing this page, you can <a href={redirectUrl}>click here</a> to view the results.</p>
      </body>
    </html>
  );
} 