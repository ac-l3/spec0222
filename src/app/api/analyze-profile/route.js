import { NextResponse } from 'next/server';
import { getFromKV, putToKV } from '../../../lib/cloudflare-kv.js';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../../../lib/analysis.js';

export const maxDuration = 90;

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
    
    const [userInfo, casts] = await Promise.all([
      fetchUserInfo(fid),
      fetchUserCasts(fid),
    ]);

    const analysis = await analyzePersonality(userInfo.profile?.bio?.text || null, casts);

    const response = {
      fid,
      username: userInfo.username,
      displayName: userInfo.display_name,
      pfpUrl: userInfo.pfp_url,
      bio: userInfo.profile?.bio?.text || null,
      analysis,
    };

    await putToKV(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error analyzing profile:', error);
    return NextResponse.json(
      { error: 'Failed to analyze profile' },
      { status: 500 }
    );
  }
} 