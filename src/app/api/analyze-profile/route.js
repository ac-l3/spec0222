import { NextResponse } from 'next/server';
import { getFromKV, putToKV } from '../../../lib/cloudflare-kv.js';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../../../lib/analysis.js';

export const maxDuration = 60;

export async function POST(request) {
  try {
    // Handle Farcaster Frame POST request
    const formData = await request.formData();
    const frameData = formData.get('trustedData.messageBytes');
    
    // Generate a random spectral type (1, 2, or 3)
    const randomType = Math.floor(Math.random() * 3) + 1;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spec0222.vercel.app';
    
    // Create a Frame response with a new image and button
    let imageUrl;
    let buttonText;
    
    switch(randomType) {
      case 1:
        imageUrl = `${baseUrl}/images/optimized/axis-framer.png`;
        buttonText = "VIEW $AXIS FRAMER ANALYSIS";
        break;
      case 2:
        imageUrl = `${baseUrl}/images/optimized/flux-drifter.png`;
        buttonText = "VIEW $FLUX DRIFTER ANALYSIS";
        break;
      case 3:
        imageUrl = `${baseUrl}/images/optimized/edge-disruptor.png`;
        buttonText = "VIEW $EDGE DISRUPTOR ANALYSIS";
        break;
      default:
        imageUrl = `${baseUrl}/images/optimized/spectral-landing.png`;
        buttonText = "VIEW ANALYSIS";
    }
    
    // Return a Frame response
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="${buttonText}" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${baseUrl}?spectralType=${randomType}" />
        </head>
        <body>
          <p>Your spectral analysis is ready. Click the button to view it.</p>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Error in POST handler:', error);
    
    // Even in case of error, return a valid Frame response
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spec0222.vercel.app';
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/images/optimized/spectral-landing.png" />
          <meta property="fc:frame:button:1" content="TRY AGAIN" />
          <meta property="fc:frame:button:1:action" content="post" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/analyze-profile" />
        </head>
        <body>
          <p>There was an error processing your request. Please try again.</p>
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    
    if (!fid) {
      return NextResponse.json(
        { error: 'Missing FID parameter' },
        { status: 400 }
      );
    }

    const cacheKey = `spectral:analysis:${fid}`;
    const cachedData = await getFromKV(cacheKey);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const data = parsed.value ? JSON.parse(parsed.value) : parsed;
        return NextResponse.json(data);
      } catch (e) {
        console.error('Error parsing cached data:', e);
      }
    }
    
    try {
      const [userInfo, casts] = await Promise.all([
        fetchUserInfo(fid),
        fetchUserCasts(fid),
      ]);

      if (!userInfo) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      if (!casts || casts.length === 0) {
        return NextResponse.json(
          { error: 'No casts found for user' },
          { status: 404 }
        );
      }

      console.log(`Analyzing profile for FID ${fid}, bio length: ${userInfo.profile?.bio?.text?.length || 0}, casts: ${casts.length}`);
      
      const analysis = await analyzePersonality(userInfo.profile?.bio?.text || null, casts);

      if (!analysis) {
        throw new Error('Analysis returned null or undefined');
      }

      const response = {
        fid,
        username: userInfo.username,
        displayName: userInfo.display_name,
        pfp_url: userInfo.pfp_url,
        bio: userInfo.profile?.bio?.text || null,
        analysis,
      };

      await putToKV(cacheKey, response);
      return NextResponse.json(response);
    } catch (innerError) {
      console.error('Error in API processing:', innerError);
      return NextResponse.json(
        { error: 'Failed to process user data', details: innerError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error analyzing profile:', error);
    return NextResponse.json(
      { error: 'Failed to analyze profile', details: error.message },
      { status: 500 }
    );
  }
} 