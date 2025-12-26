'use client';

import { useState, useEffect } from 'react';
import { UI_CONFIG } from '../../../lib/constants';

/**
 * Custom hook for managing Frame user state
 */
export function useFrameUser(fid) {
  const [userFid, setUserFid] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(null);

  useEffect(() => {
    const checkUserFid = () => {
      const currentUserFid = window.userFid;
      
      if (currentUserFid !== userFid) {
        setUserFid(currentUserFid);
        setIsOwnProfile(currentUserFid ? (currentUserFid && fid && Number(currentUserFid) === Number(fid)) : null);
        console.log('Profile comparison:', { userFid: currentUserFid, fid });
      }
    };
    
    checkUserFid();
    const interval = setInterval(checkUserFid, UI_CONFIG.USER_FID_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [fid, userFid]);

  return { userFid, isOwnProfile };
}

