'use client';

import { SPECTRAL_TYPES } from '../../lib/constants';
import SpectralVisual from './SpectralVisual';

export default function AnalysisHeader({ analysis, username }) {
  if (!analysis || !analysis.spectralType) return null;
  
  return (
    <>
      {/* Spectral Type Visual */}
      <div className="mb-9 flex justify-center">
        <SpectralVisual spectralType={analysis.spectralType} />
      </div>
      
      {/* Username and Spectral Type */}
      <div className="mb-8">
        <p className="text-base mb-2">@{username || ''} aligns with</p>
        <h2 className="text-3xl font-bold mb-9">
          {SPECTRAL_TYPES[analysis.spectralType]?.name || 'Unknown'}
        </h2>
      </div>
    </>
  );
}

