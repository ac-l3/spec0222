import { NextResponse } from 'next/server';
import { getFromKV } from '../../../lib/cloudflare-kv';
import { CACHE_CONFIG } from '../../../lib/constants';
import { SPECTRAL_TYPES } from '../../../lib/constants';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    
    if (!fid) {
      return NextResponse.redirect(new URL('/images/optimized/spectral-landing.png', request.url));
    }

    // Try to get the user's spectral type from KV
    const cacheKey = `${CACHE_CONFIG.KEY_PREFIX.ANALYSIS}${fid}`;
    const cachedData = await getFromKV(cacheKey);
    
    let spectralType = null;
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const data = parsed.value ? JSON.parse(parsed.value) : parsed;
        spectralType = data.analysis?.spectralType;
      } catch (e) {
        console.error('Error parsing cached data:', e);
      }
    }

    // If we don't have a spectral type, generate a deterministic one based on the FID
    if (!spectralType) {
      // Simple hash function to get a consistent number from the FID
      const fidNum = parseInt(fid);
      spectralType = ((fidNum % 3) + 1);
    }

    // Get the appropriate image based on spectral type
    let imageUrl;
    switch(spectralType) {
      case 1:
        imageUrl = '/images/optimized/axis-framer.png';
        break;
      case 2:
        imageUrl = '/images/optimized/flux-drifter.png';
        break;
      case 3:
        imageUrl = '/images/optimized/edge-disruptor.png';
        break;
      default:
        imageUrl = '/images/optimized/spectral-landing.png';
    }

    // Redirect to the appropriate image
    return NextResponse.redirect(new URL(imageUrl, request.url));
  } catch (error) {
    console.error('Error generating image:', error);
    // Default to the landing image if there's an error
    return NextResponse.redirect(new URL('/images/optimized/spectral-landing.png', request.url));
  }
} 