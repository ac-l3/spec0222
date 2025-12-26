import { NextResponse } from 'next/server';
import { getEnvVar } from '../../../lib/env-validation';

/**
 * API endpoint to check environment variable status
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

  const status = {
    GEMINI_API_KEY: {
      exists: !!process.env.GEMINI_API_KEY,
      length: process.env.GEMINI_API_KEY?.length || 0,
      preview: process.env.GEMINI_API_KEY?.slice(0, 5) + '...' || 'missing',
    },
    NEYNAR_API_KEY: {
      exists: !!process.env.NEYNAR_API_KEY,
      length: process.env.NEYNAR_API_KEY?.length || 0,
      preview: process.env.NEYNAR_API_KEY?.slice(0, 5) + '...' || 'missing',
    },
    NEXT_PUBLIC_BASE_URL: {
      exists: !!process.env.NEXT_PUBLIC_BASE_URL,
      value: process.env.NEXT_PUBLIC_BASE_URL || 'missing',
    },
    CLOUDFLARE_ACCOUNT_ID: {
      exists: !!process.env.CLOUDFLARE_ACCOUNT_ID,
      preview: process.env.CLOUDFLARE_ACCOUNT_ID?.slice(0, 10) + '...' || 'missing',
    },
    CLOUDFLARE_KV_NAMESPACE_ID: {
      exists: !!process.env.CLOUDFLARE_KV_NAMESPACE_ID,
      preview: process.env.CLOUDFLARE_KV_NAMESPACE_ID?.slice(0, 10) + '...' || 'missing',
    },
    CLOUDFLARE_API_TOKEN: {
      exists: !!process.env.CLOUDFLARE_API_TOKEN,
      preview: process.env.CLOUDFLARE_API_TOKEN?.slice(0, 10) + '...' || 'missing',
    },
  };

  // Try to validate
  let validationError = null;
  try {
    getEnvVar('GEMINI_API_KEY');
    getEnvVar('NEYNAR_API_KEY');
    getEnvVar('NEXT_PUBLIC_BASE_URL');
  } catch (error) {
    validationError = error.message;
  }

  return NextResponse.json({
    status,
    validationError,
    allValid: !validationError,
  });
}

