'use client';

import { Fira_Code } from 'next/font/google';
import { SPECTRAL_TYPES, SHARE_CONFIG } from '../../lib/constants';

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const ZORA_URLS = {
  1: 'https://zora.co/coin/base:0x747db8fb98ec1af5853ae399a1b7df9d5acd37e8?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
  2: 'https://zora.co/coin/base:0x465e8207de3de9a13653b1681dc569f1160ccfe7?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
  3: 'https://zora.co/coin/base:0x844a1c74927bdc3b6c9938b65e737f5539048c67?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
  4: 'https://zora.co/collect/base:0x0910c0e7cbe84fa0575e6002924c617afe820b44/2?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
  5: 'https://zora.co/collect/base:0x0910c0e7cbe84fa0575e6002924c617afe820b44/3?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160',
  6: 'https://zora.co/collect/base:0xa2d7f2b23e55d4816c02b84675007761b683be46/9?referrer=0xd51f298dd8d0fc36b858c37c7b34531be277f160'
};

function getZoraUrl(spectralType) {
  return ZORA_URLS[spectralType] || 'https://zora.co';
}

export default function AnalysisActions({ analysis, onShare, isSharing }) {
  if (!analysis || !analysis.spectralType) return null;
  
  const spectralTypeName = SPECTRAL_TYPES[analysis.spectralType]?.name || 'Unknown';
  
  return (
    <div className="bg-[#222222] p-4 mb-6">
      <p className={`text-center mb-4 text-[13px] text-[#999999] ${firaCode.className}`}>
        Alignments reveal Spectrals. This one matches you. Take ownership.
      </p>
      
      <div className="flex justify-between w-full gap-4">
        <button
          onClick={() => window.open(getZoraUrl(analysis.spectralType), '_blank')}
          className="w-1/2 py-1 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all text-center text-xs"
        >
          ACQUIRE {spectralTypeName.split(' ')[0]}
        </button>
        
        <button
          onClick={onShare}
          disabled={isSharing}
          className="w-1/2 py-1 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all disabled:opacity-50 text-center text-xs"
        >
          {isSharing ? 'SHARING...' : 'SHARE FINDINGS'}
        </button>
      </div>
    </div>
  );
}

