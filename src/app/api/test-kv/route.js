import { NextResponse } from 'next/server';
import { putToKV, getFromKV } from '../../../lib/cloudflare-kv';

/**
 * Test endpoint to verify Cloudflare KV is working
 * Only available in development mode
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const testKey = 'test:kv:connection';
  const testValue = `KV test at ${new Date().toISOString()}`;

  try {
    // Test write
    const writeSuccess = await putToKV(testKey, testValue, 60); // 60 second TTL
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test read
    const readValue = await getFromKV(testKey);

    return NextResponse.json({
      success: true,
      tests: {
        write: {
          success: writeSuccess,
          message: writeSuccess ? 'Successfully wrote to KV' : 'Failed to write to KV',
        },
        read: {
          success: readValue !== null,
          message: readValue !== null ? 'Successfully read from KV' : 'Failed to read from KV',
          value: readValue,
          matches: readValue === testValue,
        },
      },
      config: {
        hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
        hasNamespaceId: !!process.env.CLOUDFLARE_KV_NAMESPACE_ID,
        hasApiToken: !!process.env.CLOUDFLARE_API_TOKEN,
        usingCloudflareKV: !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_KV_NAMESPACE_ID && process.env.CLOUDFLARE_API_TOKEN),
        usingMemoryCache: !(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_KV_NAMESPACE_ID && process.env.CLOUDFLARE_API_TOKEN),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
        hasNamespaceId: !!process.env.CLOUDFLARE_KV_NAMESPACE_ID,
        hasApiToken: !!process.env.CLOUDFLARE_API_TOKEN,
      },
    }, { status: 500 });
  }
}

