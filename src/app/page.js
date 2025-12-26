// This is a server component (no 'use client' directive)
import HomeComponent from './components/HomeComponent';
import { generateFrameMetadata } from '../lib/page-metadata';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../lib/analysis';
import { getFromKV, putToKV } from '../lib/cloudflare-kv';
import { CACHE_CONFIG } from '../lib/constants';

export async function generateMetadata({ searchParams }) {
  return generateFrameMetadata({ searchParams });
}

export default async function Page({ searchParams }) {
  const params = await searchParams;
  const rawFid = params?.fid;
  const fid = rawFid ? parseInt(rawFid, 10) : null;
  
  let initialData = null;
  if (fid && !isNaN(fid)) {
    try {
      // Try to get from KV cache first
      const cacheKey = `${CACHE_CONFIG.KEY_PREFIX.ANALYSIS}${fid}`;
      const cachedData = await getFromKV(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          initialData = parsed.value ? JSON.parse(parsed.value) : parsed;
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      }

      // If no cache hit, compute and cache
      if (!initialData) {
        console.log('Cache miss in SSR, computing analysis for FID:', fid);
        const [userInfo, casts] = await Promise.all([
          fetchUserInfo(fid),
          fetchUserCasts(fid),
        ]);
        
        const analysis = await analyzePersonality(userInfo.profile?.bio?.text || null, casts);
        
        initialData = {
          fid,
          analysis,
          username: userInfo.username,
          displayName: userInfo.display_name,
          pfpUrl: userInfo.pfp_url,
          bio: userInfo.profile?.bio?.text || null,
        };

        // Cache the result
        await putToKV(cacheKey, initialData);
      }
    } catch (error) {
      console.error('Error in SSR:', error);
    }
  }

  return <HomeComponent fid={fid} initialData={initialData} />;
}
