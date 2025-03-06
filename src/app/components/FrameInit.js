'use client';

import { useEffect } from 'react';
import { initializeFrame } from '../../lib/frame';

export function FrameInit() {
  useEffect(() => {
    console.log('FrameInit component mounted, initializing frame');
    
    // Check if we're in debug mode
    const url = new URL(window.location.href);
    const isDebugMode = url.searchParams.has('r_v2');
    console.log('Debug mode detected in FrameInit:', isDebugMode);
    
    // Initialize the frame
    initializeFrame();
    
    return () => {
      console.log('FrameInit component unmounted');
    };
  }, []);

  return null;
} 