'use client';

import { useState, useEffect, useRef } from 'react';
import { UI_CONFIG } from '../../../lib/constants';

/**
 * Custom hook for managing Frame user state
 */
export function useFrameUser(fid) {
  const [userFid, setUserFid] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(null);
  const previousUserFidRef = useRef(null);

  useEffect(() => {
    const checkUserFid = () => {
      const currentUserFid = window.userFid;
      
      // Only update state if the value actually changed
      if (currentUserFid !== previousUserFidRef.current) {
        previousUserFidRef.current = currentUserFid;
        setUserFid(currentUserFid);
        setIsOwnProfile(currentUserFid ? (currentUserFid && fid && Number(currentUserFid) === Number(fid)) : null);
        // Only log when FID actually changes, not on every check
        if (currentUserFid) {
          console.log('Profile comparison:', { userFid: currentUserFid, fid });
        }
      }
    };
    
    checkUserFid();
    const interval = setInterval(checkUserFid, UI_CONFIG.USER_FID_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [fid]); // Removed userFid from dependencies to prevent infinite loop

  return { userFid, isOwnProfile };
}


