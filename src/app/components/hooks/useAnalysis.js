'use client';

import { useState, useEffect } from 'react';

async function getUserFromSdkContext(sdk) {
  if (!sdk) return null;
  try {
    const contextCandidate = sdk.context;
    if (contextCandidate) {
      const context = typeof contextCandidate.then === 'function'
        ? await contextCandidate
        : contextCandidate;
      if (context?.user) {
        return context.user;
      }
    }
  } catch (err) {
    console.log('Error getting context from SDK:', err);
  }

  return sdk.user || null;
}

/**
 * Custom hook for managing analysis state and operations
 */
export function useAnalysis(initialFid, initialData) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(initialData?.analysis || null);
  const [fid, setFid] = useState(initialFid);
  const [userInfo, setUserInfo] = useState(
    initialData ? {
      username: initialData.username,
      display_name: initialData.displayName,
      pfp_url: initialData.pfpUrl,
      profile: { bio: { text: initialData.bio } }
    } : null
  );
  const [errorMessage, setErrorMessage] = useState(null);

  async function analyzeWithRetry(data) {
    if (!data || typeof data !== 'object') {
      console.error('Invalid data structure:', data);
      throw new Error('Invalid data structure');
    }

    if (!data.analysis?.spectralType || !data.analysis?.researchProfile) {
      console.log('Response data:', data);
      throw new Error('Invalid analysis structure');
    }

    return data;
  }

  // Load analysis if we have an FID in the URL but no initial data
  useEffect(() => {
    async function loadAnalysis() {
      if (!initialFid || initialData) return;
      
      try {
        const response = await fetch(`/api/analyze-profile?fid=${initialFid}&nocache=${Date.now()}`);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        const validatedData = await analyzeWithRetry(data);
        
        console.log('Loaded analysis for FID:', initialFid, 'Data:', validatedData);
        setAnalysis(validatedData.analysis);
        setFid(validatedData.fid);
        setUserInfo({
          username: validatedData.username,
          display_name: validatedData.displayName,
          pfp_url: validatedData.pfpUrl,
          profile: { bio: { text: validatedData.bio } }
        });
      } catch (error) {
        console.error('Error loading analysis:', error);
        setErrorMessage('Failed to load analysis. Please try again.');
      }
    }

    loadAnalysis();
  }, [initialFid, initialData]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Try multiple sources for user FID with retry logic
      let userFid = window.userFid;
      
      // If not found, try to get from SDK with retries (user context might load asynchronously)
      if (!userFid) {
        console.log('User FID not cached, trying to get from SDK...');
        
        // Try to import SDK if not already available
        let sdk = window.sdk || window.frame?.sdk;
        if (!sdk) {
          try {
            const module = await import('@farcaster/miniapp-sdk');
            sdk = module.sdk;
            console.log('Imported SDK for FID retrieval');
          } catch (e) {
            console.log('Could not import SDK:', e);
          }
        }
        
        // Ensure SDK is ready before accessing context
        if (sdk?.actions?.ready) {
          try {
            await sdk.actions.ready();
            console.log('SDK ready() called for FID retrieval');
          } catch (e) {
            console.log('SDK ready() already called or failed:', e);
          }
        }
        
        // Try multiple times with increasing delays
        for (let attempt = 0; attempt < 10; attempt++) {
          // Re-check SDK on each attempt (might be injected later)
          sdk = window.sdk || window.frame?.sdk || sdk;
          
          // Log full SDK structure for debugging (only first attempt)
          if (attempt === 0) {
            console.log('SDK structure:', {
              hasSdk: !!sdk,
              sdkType: sdk ? (window.sdk ? 'window.sdk' : window.frame?.sdk ? 'window.frame.sdk' : 'imported') : 'none',
              sdkKeys: sdk ? Object.keys(sdk) : [],
              hasContext: !!sdk?.context,
              contextType: typeof sdk?.context,
              hasDirectUser: !!sdk?.user
            });
          }
          
          const user = await getUserFromSdkContext(sdk);
          
          if (user) {
            // Try multiple possible FID locations
            userFid = user.fid || user.user?.fid || user.userFid;
            
            if (userFid) {
              console.log('Found user FID from SDK:', userFid, 'from user object:', user);
              window.userFid = userFid; // Cache it for future use
              break;
            } else {
              console.log('User object found but no FID:', user, 'keys:', Object.keys(user));
            }
          }
          
          if (attempt < 9) {
            // Only log every 3 attempts to reduce console spam
            if (attempt % 3 === 0 || attempt === 0) {
              console.log(`User FID not found, retrying in ${(attempt + 1) * 300}ms... (attempt ${attempt + 1}/10)`);
            }
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 300));
          }
        }
      }
      
      if (!userFid) {
        console.error('No user FID found after retries', {
          windowUserFid: window.userFid,
          hasSdk: !!(window.sdk || window.frame?.sdk),
          sdkContext: window.sdk?.context || window.frame?.sdk?.context,
          fullWindow: {
            sdk: window.sdk,
            frameSdk: window.frame?.sdk,
            userFid: window.userFid
          }
        });
        setErrorMessage('Unable to identify user. Please try again.');
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch(`/api/analyze-profile?fid=${userFid}&nocache=${Date.now()}`);
      const responseText = await response.text();
      if (!response.ok) {
        let errorMessage = `API returned ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData?.details || errorData?.error || errorMessage;
        } catch (parseError) {
          console.log('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError, responseText);
        throw new Error('Invalid response from analysis service.');
      }
      const validatedData = await analyzeWithRetry(data);
      
      console.log('Analysis result:', validatedData);
      
      window.history.pushState({}, '', `/?fid=${userFid}`);
      
      setAnalysis(validatedData.analysis);
      setFid(userFid);
      setUserInfo({
        username: validatedData.username,
        display_name: validatedData.displayName,
        pfp_url: validatedData.pfpUrl,
        profile: { bio: { text: validatedData.bio } }
      });
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error?.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analysis,
    fid,
    userInfo,
    isAnalyzing,
    errorMessage,
    setErrorMessage,
    handleAnalyze,
  };
}
