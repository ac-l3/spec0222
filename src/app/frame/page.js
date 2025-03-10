// This is a server component (no 'use client' directive)
import { SPECTRAL_TYPES } from '../../lib/constants';

// This is a simple Frame implementation using the Farcaster Frame specification
export default async function FramePage({ searchParams }) {
  const { fid, type, username } = searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  // Always use the static SPECTRAL ALIGNMENT image for consistent frame rendering
  let imageUrl = `${baseUrl}/images/spectral-landing.png`;
  let targetUrl = baseUrl;
  let buttonText = "Reveal Your Spectral Alignment";
  
  // If username is provided, customize button text
  if (username) {
    const decodedUsername = decodeURIComponent(username);
    buttonText = `View ${decodedUsername}'s Spectral Alignment`;
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
        <script dangerouslySetInnerHTML={{
          __html: `window.location.href = "${redirectUrl}";`
        }} />
      </body>
    </html>
  );
} 