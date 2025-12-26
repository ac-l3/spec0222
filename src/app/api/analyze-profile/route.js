import { NextResponse } from 'next/server';
import { getFromKV, putToKV } from '../../../lib/cloudflare-kv.js';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../../../lib/analysis.js';
import { CACHE_CONFIG } from '../../../lib/constants.js';

export const maxDuration = 60;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const noCache = searchParams.get('nocache');
    
    if (!fid) {
      return NextResponse.json(
        { error: 'Missing FID parameter' },
        { status: 400 }
      );
    }

    const cacheKey = `${CACHE_CONFIG.KEY_PREFIX.ANALYSIS}${fid}`;
    
    // Only check cache if nocache parameter is not present
    if (!noCache) {
      const cachedData = await getFromKV(cacheKey);
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const data = parsed.value ? JSON.parse(parsed.value) : parsed;
          console.log(`Cache HIT for FID ${fid} - returning cached analysis`);
          return NextResponse.json(data);
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      } else {
        console.log(`Cache MISS for FID ${fid} - will fetch fresh data`);
      }
    } else {
      console.log(`Cache BYPASSED for FID ${fid} (nocache parameter present) - will fetch fresh data`);
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