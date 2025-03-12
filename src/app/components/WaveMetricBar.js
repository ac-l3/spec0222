'use client';

import React from 'react';

/**
 * WaveMetricBar component
 * Renders a progress bar with a subtle wave animation
 */
export default function WaveMetricBar({ value, maxValue = 5, label }) {
  // Calculate percentage (capped at 100%)
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-[#BEBFC2] text-sm">{label}</span>
          <span className="text-right text-[#BEBFC2] text-sm">{value}/{maxValue}</span>
        </div>
      )}
      
      <div className="w-full bg-[#333333] h-1">
        <div 
          className="relative h-1 overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          {/* Static background */}
          <div className="absolute inset-0 bg-[#C8FA1A]"></div>
          
          {/* Wave animation layers */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{ 
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'waveMove 2s linear infinite',
              backgroundSize: '200% 100%'
            }}
          ></div>
          
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              animation: 'waveMove 3s linear infinite',
              backgroundSize: '200% 100%',
              animationDelay: '0.5s'
            }}
          ></div>
          
          {/* Global styles for the animation */}
          <style jsx global>{`
            @keyframes waveMove {
              0% { background-position: 0% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
} 