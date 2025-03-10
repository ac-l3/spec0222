import { NextResponse } from 'next/server';

export const runtime = 'edge';

export const maxDuration = 60;

// Simplified GET method that directly returns the OG image URL
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const type = searchParams.get('type');
    
    if (!username || !type) {
      return NextResponse.json(
        { error: 'Username and type parameters are required' },
        { status: 400 }
      );
    }

    console.log('generate share image URL for', { username, type });

    // Simply construct the OG image URL directly
    const ogUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?username=${encodeURIComponent(username)}&type=${encodeURIComponent(type)}`;
    
    console.log('Created OG URL:', ogUrl);
    
    // Return the URL directly - no need to store in KV or R2
    return NextResponse.json({ imageUrl: ogUrl });
  } catch (error) {
    console.error('Share image URL generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate share image URL' },
      { status: 500 }
    );
  }
}

// Simplified POST method for backward compatibility
export async function POST(request) {
  try {
    const { fid } = await request.json();
    
    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    console.log('generate share image URL for FID', fid);

    // Simply construct the OG image URL directly
    const ogUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?fid=${fid}`;
    
    console.log('Created OG URL:', ogUrl);
    
    // Return the URL directly - no need to store in KV or R2
    return NextResponse.json({ imageUrl: ogUrl });
  } catch (error) {
    console.error('Share image URL generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate share image URL' },
      { status: 500 }
    );
  }
} 