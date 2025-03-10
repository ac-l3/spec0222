// This is a server component (no 'use client' directive)
import { SPECTRAL_TYPES } from '../../lib/constants';

// This is a simple Frame implementation using the Farcaster Frame specification
export default async function FramePage({ searchParams }) {
  const { type } = searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  // Default values
  let imageUrl = `${baseUrl}/image.png`;
  let buttonText = "Reveal Your Spectral Alignment";
  let redirectUrl = baseUrl;
  
  // If type is provided, use it for the image URL
  if (type) {
    const typeNumber = parseInt(type);
    if (!isNaN(typeNumber) && SPECTRAL_TYPES[typeNumber]) {
      // SIMPLIFIED VERSION: Just generate an image for the type
      imageUrl = `${baseUrl}/api/og?type=${typeNumber}`;
      
      // Set redirect URL to just have the type parameter
      redirectUrl = `${baseUrl}?type=${typeNumber}`;
    }
  }

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