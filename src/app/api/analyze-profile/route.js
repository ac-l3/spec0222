import { NextResponse } from 'next/server';
import { getFromKV, putToKV } from '../../../lib/cloudflare-kv.js';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../../../lib/analysis.js';

export const maxDuration = 60;

export async function POST(request) {
  try {
    // Handle Farcaster Frame POST request
    const formData = await request.formData();
    const frameData = formData.get('trustedData.messageBytes');
    
    // Extract FID from the frame data if available
    let fid = null;
    if (frameData) {
      try {
        // For now, just use a fallback approach
        console.log('Received frame data, using fallback approach');
        // Return a redirect to the main page with a random spectral type
        const randomType = Math.floor(Math.random() * 3) + 1;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spec0222.vercel.app';
        
        return new NextResponse(null, {
          status: 302,
          headers: {
            'Location': `${baseUrl}?spectralType=${randomType}`,
            'Content-Type': 'text/html'
          }
        });
      } catch (error) {
        console.error('Error parsing frame data:', error);
      }
    }
    
    // If we couldn't extract FID from frame data, redirect to main page
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spec0222.vercel.app';
    return new NextResponse(null, {
      status: 302,
      headers: {
        'Location': baseUrl,
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
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