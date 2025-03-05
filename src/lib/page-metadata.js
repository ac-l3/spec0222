import { getFrameMetadata } from 'frames.js';

export function generateFrameMetadata(searchParams) {
  const fid = searchParams.get('fid');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://spec0222.vercel.app';
  const imageUrl = fid ? `${baseUrl}/api/generate-image?fid=${fid}` : `${baseUrl}/images/optimized/spectral-landing.png`;
  
  const frameMetadata = {
    version: 'vNext',
    title: 'Spectral Lab Frame',
    description: 'Discover your spectral type and unlock your research potential.',
    image: imageUrl,
    buttons: [
      {
        label: fid ? 'VIEW ANALYSIS' : 'ANALYZE PROFILE',
        action: 'post',
        target: `${baseUrl}/api/analyze-profile`
      }
    ]
  };

  const { openGraph, other } = getFrameMetadata(frameMetadata);

  return {
    title: 'Spectral Lab Frame',
    description: 'Discover your spectral type and unlock your research potential.',
    openGraph,
    other
  };
} 