'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

// Default placeholder gradients for each type
const placeholderGradients = {
  1: 'bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500',  // AXIS Framer
  2: 'bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500', // FLUX Drifter
  3: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' // EDGE Disruptor
};

// Image paths for each spectral type
const imagePaths = {
  1: '/images/axis-framer.png',
  2: '/images/flux-drifter.png',
  3: '/images/edge-disruptor.png',
  landing: '/images/spectral-landing.png'
};

export default function SpectralVisual({ spectralType, isLanding = false }) {
  const [imagesLoaded, setImagesLoaded] = useState({
    1: false,
    2: false,
    3: false,
    landing: false
  });
  
  // Get the correct image path or use a default
  const imagePath = imagePaths[spectralType] || imagePaths[1];
  
  // If this is the landing page, render the rectangular landing visual
  if (isLanding) {
    return (
      <div className="w-full">
        <div className="relative w-full aspect-[5/3] overflow-hidden">
          {/* Placeholder gradient shown while image loads or if it fails */}
          <div 
            className={`absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-80 ${imagesLoaded.landing ? 'hidden' : 'block'}`}
          />
          
          {/* The landing spectral image */}
          <Image
            src={imagePaths.landing}
            alt="Spectral Lab Visual"
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className={`object-cover ${imagesLoaded.landing ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
            onLoad={() => setImagesLoaded(prev => ({ ...prev, landing: true }))}
            onError={() => setImagesLoaded(prev => ({ ...prev, landing: false }))}
          />
          
          {/* Scanline effect overlay */}
          <div className="absolute inset-0 bg-scanlines opacity-70"></div>
        </div>
      </div>
    );
  }
  
  // Otherwise render the spectral type visual
  return (
    <div className="relative w-44 h-44 mx-auto">
      {/* Placeholder gradient shown while image loads or if it fails */}
      <div 
        className={`absolute inset-0 rounded-full ${placeholderGradients[spectralType] || placeholderGradients[1]} opacity-80 ${imagesLoaded[spectralType] ? 'hidden' : 'block'}`}
      />
      
      {/* The actual spectral type image */}
      <Image
        src={imagePath}
        alt={`Spectral Type ${spectralType} Visual`}
        width={176}
        height={176}
        className={`rounded-full ${imagesLoaded[spectralType] ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        onLoad={() => setImagesLoaded(prev => ({ ...prev, [spectralType]: true }))}
        onError={() => setImagesLoaded(prev => ({ ...prev, [spectralType]: false }))}
      />
    </div>
  );
} 