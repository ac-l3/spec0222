'use client';

import { Fira_Code } from 'next/font/google';
import Image from 'next/image';
import TypewriterEffect from './TypewriterEffect';

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export default function LandingPage({ onAnalyze, isAnalyzing }) {
  return (
    <div className="text-center flex flex-col justify-between min-h-[80vh] max-w-3xl mx-auto">
      <div className="flex justify-center mt-12 mb-4">
        <Image 
          src="/images/title.png" 
          alt="SPECTRAL ALIGNMENT" 
          width={400} 
          height={200}
          priority
        />
      </div>
      
      <div className="flex-grow flex items-center justify-center">
        <div className="text-[#C0C2C5] text-xs px-4 sm:px-10 py-6 mb-4 text-left w-full max-w-[85%] mx-auto">
          <TypewriterEffect 
            phrases={[
              "THE SPECTRAL LAB DECODES HIDDEN PATTERNS IN HOW WE APPROACH REALITY.",
              "BETWEEN SIGNAL AND INTERFERENCE, YOUR APPROACH TO THE UNKNOWN REVEALS YOUR FUNDAMENTAL ALIGNMENT.",
              "YOUR METHOD OF ENGAGING WITH CHAOS ISN'T RANDOM—IT'S A SPECTRAL SIGNATURE WE CAN DETECT.",
              "THE SPECTRAL LAB TRACKS HOW MINDS TRANSFORM UNSEEN PATTERNS INTO MEANING THROUGH DISTINCT FREQUENCIES.",
              "SOME BUILD STRUCTURE FROM NOISE, OTHERS FLOW BETWEEN SIGNALS, AND A FEW INTENTIONALLY DISRUPT THE PATTERN.",
              "THE UNKNOWN ISN'T SIMPLY EXPLORED—IT'S WHERE YOUR CONSCIOUSNESS CREATES MEANING THROUGH SPECIFIC PATTERNS.",
              "BEYOND STATIC CLASSIFICATION LIES YOUR TRUE ALIGNMENT—HOW YOU MOVE BETWEEN ORDER AND CHAOS.",
              "$AXIS FRAMES, $FLUX FLOWS, $EDGE BREAKS.",
              "IN CHAOS: $AXIS CREATES ORDER, $FLUX RIDES CURRENTS, $EDGE TRANSFORMS.",
              "CARRY YOUR ALIGNMENT AS A BADGE OF HONOR. OWN YOUR SPECTRAL TRUTH."
            ]}
            typeSpeed={40}
            pauseDuration={1500}
          />
        </div>
      </div>
      
      <div className="bg-[#222222] p-4 mb-6 mt-auto">
        <p className={`text-center mb-4 text-[13px] text-[#999999] ${firaCode.className}`}>
          Your alignment exposes your nature and a Spectral identity worth embracing.
        </p>
        
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full py-1 bg-[#C8FA1A] text-[#191919] font-bold hover:brightness-110 transition-all disabled:opacity-50 text-xs"
        >
          {isAnalyzing ? 'ANALYZING...' : 'REVEAL YOUR SPECTRAL ALIGNMENT'}
        </button>
        
        {/* Test Error Message Button - Only shows in development */}
        {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
          <button
            onClick={() => {
              // Trigger test error via custom event
              window.dispatchEvent(new CustomEvent('test-error', { detail: 'This is a test error message to verify the error UI works!' }));
            }}
            className="w-full mt-2 py-1 bg-red-600 text-white font-bold hover:brightness-110 transition-all text-xs"
          >
            TEST ERROR MESSAGE
          </button>
        )}
      </div>
    </div>
  );
}

