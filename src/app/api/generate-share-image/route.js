import { NextResponse } from 'next/server';
import { uploadToR2, checkIfExists, getPublicUrl } from '../../../lib/cloudflare-r2';
import { getFromKV, putToKV } from '../../../lib/cloudflare-kv';

export const runtime = 'edge';

export const maxDuration = 90;

export async function POST(request) {
  try {
    const { fid } = await request.json();
    
    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    console.log('generate share image', fid);

    // Check if image already exists
    const filename = `spectral/spectral-${fid}-${Date.now()}.png`;
    const cacheKey = `spectral:share-image:${fid}`;
    
    try {
      const exists = await checkIfExists(filename);
      if (exists) {
        const imageUrl = getPublicUrl(filename);
        await putToKV(cacheKey, imageUrl);
        return NextResponse.json({ imageUrl });
      }
    } catch (error) {
      // Continue with generation if check fails
    }

    // Generate the OG image
    const ogUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?fid=${fid}`;

    console.log('calling og url', ogUrl);

    const ogResponse = await fetch(ogUrl, { 
      cache: 'no-store',
      method: 'GET'
    });
    
    if (!ogResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to generate OG image' },
        { status: ogResponse.status }
      );
    }

    const imageBuffer = await ogResponse.arrayBuffer();
    const imageUrl = await uploadToR2(imageBuffer, filename);

    console.log('caching image url', imageUrl);

    // Store the image URL in KV
    await putToKV(cacheKey, imageUrl);
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Share image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
} 