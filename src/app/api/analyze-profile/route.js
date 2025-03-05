import { NextResponse } from 'next/server';
import { getFromKV, putToKV } from '../../../lib/cloudflare-kv.js';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../../../lib/analysis.js';
import { getFrameHtml } from 'frames.js';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const frameData = formData.get('trustedData.messageBytes');
    
    // Generate a random spectral type (1, 2, or 3)
    const randomType = Math.floor(Math.random() * 3) + 1;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spec0222.vercel.app';
    
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

    const frameResponse = {
      version: 'vNext',
      image: imageUrl,
      buttons: [
        {
          label: buttonText,
          action: 'link',
          target: `${baseUrl}?spectralType=${randomType}`
        }
      ]
    };

    const html = getFrameHtml(frameResponse);
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spec0222.vercel.app';
    const errorFrameResponse = {
      version: 'vNext',
      image: `${baseUrl}/images/optimized/spectral-landing.png`,
      buttons: [
        {
          label: 'TRY AGAIN',
          action: 'post',
          target: `${baseUrl}/api/analyze-profile`
        }
      ]
    };

    const html = getFrameHtml(errorFrameResponse);
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
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