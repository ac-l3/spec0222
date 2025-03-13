import { NextResponse } from 'next/server';
import { getFromKV, putToKV } from '../../../lib/cloudflare-kv.js';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../../../lib/analysis.js';

export const maxDuration = 60;

// Simple request throttling system
const THROTTLE_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10; // Adjust based on your actual limit
const requestTimestamps = [];

function canMakeRequest() {
  const now = Date.now();
  
  // Remove timestamps older than the throttle window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - THROTTLE_WINDOW_MS) {
    requestTimestamps.shift();
  }
  
  // Check if we've hit the limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  // Add current timestamp and allow the request
  requestTimestamps.push(now);
  return true;
}

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

    const cacheKey = `spectral:analysis:${fid}`;
    
    // Only check cache if nocache parameter is not present
    if (!noCache) {
      const cachedData = await getFromKV(cacheKey);
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData.value);
          return NextResponse.json(parsed);
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      }
    }
    
    // Check if we're within rate limits before proceeding
    if (!canMakeRequest()) {
      console.log('Throttling request - too many requests in the last minute');
      return NextResponse.json(
        { error: 'Too many analysis requests. Please try again in a minute.' },
        { status: 429 }
      );
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