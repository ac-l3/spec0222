'use client';

import { useEffect } from 'react';
import { initializeFrame } from '../../lib/frame';

export function FrameInit() {
  useEffect(() => {
    console.log('FrameInit component mounted, initializing frame');
    
    // Try to call ready() immediately if SDK is already available
    // This handles cases where SDK is injected before React mounts
    const tryImmediateReady = () => {
      const sdk = window.sdk || window.frame?.sdk;
      if (sdk?.actions?.ready) {
        console.log('Calling ready() immediately - SDK already available');
        sdk.actions.ready().catch(err => {
          console.log('Immediate ready() failed, will retry in initializeFrame:', err);
        });
      }
    };
    
    // Try immediately
    tryImmediateReady();
    
    // Also try after a short delay in case SDK is injected asynchronously
    setTimeout(tryImmediateReady, 100);
    
    // Check if we're in debug mode
    const url = new URL(window.location.href);
    const isDebugMode = url.searchParams.has('r_v2');
    console.log('Debug mode detected in FrameInit:', isDebugMode);
    
    // Initialize the frame (this will also call ready() if not already called)
    initializeFrame();
    
    return () => {
      console.log('FrameInit component unmounted');
    };
  }, []);

  return null;
} 