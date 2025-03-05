// This is a server component (no 'use client' directive)
import HomeComponent from './components/HomeComponent';
import { generateFrameMetadata } from '../lib/page-metadata';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../lib/analysis';
import { getFromKV, putToKV } from '../lib/cloudflare-kv';
import { SPECTRAL_TYPES } from '../lib/constants';

// Generate metadata for the page, including Frame metadata
export async function generateMetadata({ searchParams }) {
  return generateFrameMetadata(searchParams);
}

export default function Page({ searchParams }) {
  const spectralType = searchParams.spectralType ? parseInt(searchParams.spectralType) : null;
  const spectralInfo = spectralType ? SPECTRAL_TYPES[spectralType] : null;

  return (
    <main>
      <HomeComponent spectralInfo={spectralInfo} />
    </main>
  );
}
