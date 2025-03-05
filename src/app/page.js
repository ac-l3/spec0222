// This is a server component (no 'use client' directive)
import HomeComponent from './components/HomeComponent';
import { generateFrameMetadata } from '../lib/page-metadata';
import { analyzePersonality, fetchUserInfo, fetchUserCasts } from '../lib/analysis';
import { getFromKV, putToKV } from '../lib/cloudflare-kv';
import { ENNEAGRAM_TYPES } from '../lib/constants';

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

// Generate metadata for the page, including Frame metadata
export async function generateMetadata({ searchParams }) {
  return generateFrameMetadata(searchParams);
}

export default function Page({ searchParams }) {
  const spectralType = searchParams.spectralType ? parseInt(searchParams.spectralType) : null;
  const spectralInfo = spectralType ? ENNEAGRAM_TYPES[spectralType - 1] : null;

  return (
    <main>
      <HomeComponent spectralInfo={spectralInfo} />
    </main>
  );
}
