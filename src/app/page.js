// This is a server component (no 'use client' directive)
import HomeComponent from './components/HomeComponent';
import { generateFrameMetadata } from '../lib/page-metadata';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../lib/analysis';
import { getFromKV, putToKV } from '../lib/cloudflare-kv';

export const ENNEAGRAM_TYPES = {
  1: "Type 1 (The Reformer)",
  2: "Type 2 (The Helper)",
  3: "Type 3 (The Achiever)",
  4: "Type 4 (The Individualist)",
  5: "Type 5 (The Investigator)",
  6: "Type 6 (The Loyalist)",
  7: "Type 7 (The Enthusiast)",
  8: "Type 8 (The Challenger)",
  9: "Type 9 (The Peacemaker)",
};

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
      const cacheKey = `enneagram:analysis:${fid}`;
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
