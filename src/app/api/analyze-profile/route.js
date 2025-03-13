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
    console.log(`Throttling activated - ${requestTimestamps.length} requests in the last minute exceeds limit of ${MAX_REQUESTS_PER_MINUTE}`);
    return false;
  }
  
  // Add current timestamp and allow the request
  requestTimestamps.push(now);
  console.log(`Request allowed - current count: ${requestTimestamps.length}/${MAX_REQUESTS_PER_MINUTE} in the last minute`);
  return true;
}

export async function GET(request) {
  console.log('API: analyze-profile route called');
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const noCache = searchParams.get('nocache');
    
    console.log(`API: Processing request for FID: ${fid}, noCache: ${!!noCache}`);
    
    if (!fid) {
      console.error('API: Missing FID parameter');
      return NextResponse.json(
        { error: 'Missing FID parameter' },
        { status: 400 }
      );
    }

    const cacheKey = `spectral:analysis:${fid}`;
    
    // Only check cache if nocache parameter is not present
    if (!noCache) {
      console.log(`API: Checking cache for key: ${cacheKey}`);
      const cachedData = await getFromKV(cacheKey);
      
      if (cachedData) {
        console.log('API: Cache hit! Returning cached data');
        try {
          const parsed = JSON.parse(cachedData.value);
          return NextResponse.json(parsed);
        } catch (e) {
          console.error('API: Error parsing cached data:', e);
        }
      } else {
        console.log('API: Cache miss, proceeding to analyze');
      }
    } else {
      console.log('API: Cache bypass requested');
    }
    
    // Check if we're within rate limits before proceeding
    if (!canMakeRequest()) {
      console.log('API: Throttling request - too many requests in the last minute');
      return NextResponse.json(
        { error: 'Too many analysis requests. Please try again in a minute.' },
        { status: 429 }
      );
    }
    
    try {
      console.log(`API: Fetching user info and casts for FID: ${fid}`);
      const [userInfo, casts] = await Promise.all([
        fetchUserInfo(fid),
        fetchUserCasts(fid),
      ]);

      console.log(`API: User info fetch result: ${!!userInfo}, bio length: ${userInfo?.profile?.bio?.text?.length || 0}`);
      console.log(`API: Casts fetch result: ${!!casts}, count: ${casts?.length || 0}`);

      if (!userInfo) {
        console.error(`API: User not found for FID: ${fid}`);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      if (!casts || casts.length === 0) {
        console.error(`API: No casts found for FID: ${fid}`);
        return NextResponse.json(
          { error: 'No casts found for user' },
          { status: 404 }
        );
      }

      console.log(`API: Analyzing profile for FID ${fid}, bio length: ${userInfo.profile?.bio?.text?.length || 0}, casts: ${casts.length}`);
      
      console.time('analyzePersonality');
      const analysis = await analyzePersonality(userInfo.profile?.bio?.text || null, casts);
      console.timeEnd('analyzePersonality');

      if (!analysis) {
        console.error('API: Analysis returned null or undefined');
        throw new Error('Analysis returned null or undefined');
      }

      console.log('API: Analysis completed successfully, preparing response');
      const response = {
        fid,
        username: userInfo.username,
        displayName: userInfo.display_name,
        pfp_url: userInfo.pfp_url,
        bio: userInfo.profile?.bio?.text || null,
        analysis,
      };

      console.log(`API: Saving results to cache key: ${cacheKey}`);
      await putToKV(cacheKey, response);
      console.log('API: Request completed successfully');
      return NextResponse.json(response);
    } catch (innerError) {
      console.error('API: Error in API processing:', innerError);
      return NextResponse.json(
        { error: 'Failed to process user data', details: innerError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API: Error analyzing profile:', error);
    return NextResponse.json(
      { error: 'Failed to analyze profile', details: error.message },
      { status: 500 }
    );
  }
} 